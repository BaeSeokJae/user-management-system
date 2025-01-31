import { Injectable } from '@nestjs/common';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { Token } from '../entities/token.entity';

@Injectable()
export class TokenRepository extends Repository<Token> {
  constructor(dataSource: DataSource) {
    super(Token, dataSource.createEntityManager());
  }

  createToken(accessToken: string, refreshToken: string, userId: string) {
    return this.create({
      accessToken,
      refreshToken,
      userId,
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    });
  }

  async updateToken(userId: string) {
    return await this.update(
      { userId: userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async findTokenWithRefreshToken(refreshToken: string, sub: string) {
    return await this.findOne({
      where: {
        refreshToken,
        isRevoked: false,
        userId: sub,
        refreshTokenExpiresAt: MoreThan(new Date()),
      },
    });
  }
}
