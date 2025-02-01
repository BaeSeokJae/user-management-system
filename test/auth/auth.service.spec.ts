import { randomUUID } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { Token } from '../../src/modules/auth/entities/token.entity';
import { TokenRepository } from '../../src/modules/auth/repositories/token.repository';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { UserRepository } from '../../src/modules/users/repositories/user.repository';
import { UsersService } from '../../src/modules/users/users.service';
import {
  cleanupTestConnection,
  createTestDataSource
} from '../test-database.module';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let dataSource: DataSource;

  const mockUser: User = {
    id: randomUUID(),
    email: 'test@example.com',
    password: bcrypt.hashSync('Test123!@', 10),
    role: UserRole.USER,
    name: '',
    isEmailVerified: false,
    createdAt: undefined,
    updatedAt: undefined,
    hashPassword: jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn()
  };

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => {
            return new UserRepository(dataSource);
          }
        },
        {
          provide: getRepositoryToken(Token),
          useFactory: () => {
            return new TokenRepository(dataSource);
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await cleanupTestConnection(dataSource);
  });

  describe('login', () => {
    it('로그인 성공시 토큰과 사용자 정보를 반환해야 함', async () => {
      // Given
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

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
    });

    it('잘못된 이메일로 로그인 시도시 UnauthorizedException을 던져야 함', async () => {
      await expect(
        service.login('wrong@email.com', 'Test123!@')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('잘못된 비밀번호로 로그인 시도시 UnauthorizedException을 던져야 함', async () => {
      await expect(
        service.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('유효한 refreshToken으로 새로운 accessToken을 발급해야 함', async () => {
      // Given
      const refreshToken = 'valid-refresh-token';
      const userId = mockUser.id;
      jwtService.verifyAsync.mockResolvedValue({ sub: userId });
      jwtService.sign.mockReturnValue('new-access-token');

      // When
      const result = await service.refreshToken(refreshToken);

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
      const userId = mockUser.id;

      // When
      const result = await service.logout(userId);

      // Then
      expect(result).toEqual({ message: '로그아웃 되었습니다.' });
    });
  });
});
