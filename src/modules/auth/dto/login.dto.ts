import { IsString, IsStrongPassword, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Test123!@'
  })
  @IsString()
  @MinLength(8)
  password: string;
}
