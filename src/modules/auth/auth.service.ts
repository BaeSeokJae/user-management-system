import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenRepository } from './repositories/token.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenRepository: TokenRepository
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 기존 토큰 무효화
    await this.tokenRepository.updateToken(user.id);

    // 새로운 토큰 발급
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '1h' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' }
    );

    // 토큰 저장
    const token = this.tokenRepository.createToken(
      accessToken,
      refreshToken,
      user.id
    );

    await this.tokenRepository.save(token);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token이 필요합니다.');
    }

    try {
      // Refresh token 검증
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // DB에서 유효한 refresh token 확인
      const token = await this.tokenRepository.findTokenWithRefreshToken(
        refreshToken,
        payload.sub
      );

      if (!token) {
        throw new UnauthorizedException('유효하지 않은 Refresh token입니다.');
      }

      // 새로운 access token 발급
      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.id,
          email: payload.email,
          role: payload.role
        },
        { expiresIn: '1h' }
      );

      // 토큰 정보 업데이트
      token.accessToken = newAccessToken;
      token.accessTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.tokenRepository.save(token);

      return {
        accessToken: newAccessToken
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 Refresh token입니다.');
    }
  }

  async logout(userId: string) {
    await this.tokenRepository.updateToken(userId);
    return { message: '로그아웃 되었습니다.' };
  }
}
