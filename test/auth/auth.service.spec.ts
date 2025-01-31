// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { randomUUID } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { Token } from '../../src/modules/auth/entities/token.entity';
import { TokenRepository } from '../../src/modules/auth/repositories/token.repository';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { UsersService } from '../../src/modules/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tokenRepository: jest.Mocked<TokenRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: bcrypt.hashSync('Test123!@', 10),
    role: UserRole.USER,
    name: '',
    isEmailVerified: false,
    createdAt: undefined,
    updatedAt: undefined,
    hashPassword: jest.fn()
  };

  const mockToken: Token = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    userId: mockUser.id,
    accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    id: randomUUID(),
    createdAt: undefined,
    isRevoked: false
  };

  const mockUsersService = {
    findByEmail: jest.fn()
  };

  const mockTokenRepository = {
    createToken: jest.fn(),
    updateToken: jest.fn(),
    save: jest.fn(),
    findTokenWithRefreshToken: jest.fn(),
    create: jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: TokenRepository,
          useValue: mockTokenRepository
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokenRepository = module.get(TokenRepository);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('로그인 성공시 토큰과 사용자 정보를 반환해야 함', async () => {
      // Given
      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      tokenRepository.createToken.mockReturnValue(mockToken);
      tokenRepository.save.mockResolvedValue(mockToken);

      // When
      const result = await service.login('test@example.com', 'Test123!@');

      // Then
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        }
      });
      expect(tokenRepository.updateToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('잘못된 이메일로 로그인 시도시 UnauthorizedException을 던져야 함', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('wrong@email.com', 'Test123!@')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('잘못된 비밀번호로 로그인 시도시 UnauthorizedException을 던져야 함', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('유효한 refreshToken으로 새로운 accessToken을 발급해야 함', async () => {
      // Given
      const payload = { sub: mockUser.id };
      jwtService.verifyAsync.mockResolvedValue(payload);
      tokenRepository.findTokenWithRefreshToken.mockResolvedValue(mockToken);
      jwtService.sign.mockReturnValue('new-access-token');

      // When
      const result = await service.refreshToken('valid-refresh-token');

      // Then
      expect(result).toEqual({
        accessToken: 'new-access-token'
      });
    });

    it('refreshToken이 없을 경우 UnauthorizedException을 던져야 함', async () => {
      await expect(service.refreshToken(null)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('유효하지 않은 refreshToken으로 요청시 UnauthorizedException을 던져야 함', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(
        service.refreshToken('invalid-refresh-token')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 토큰이 무효화되어야 함', async () => {
      // Given
      tokenRepository.updateToken.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: []
      });

      // When
      const result = await service.logout(mockUser.id);

      // Then
      expect(result).toEqual({ message: '로그아웃 되었습니다.' });
      expect(tokenRepository.updateToken).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
