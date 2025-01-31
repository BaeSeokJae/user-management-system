import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/password.decorator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Test123!',
    description:
      '최소 8자 이상, 특수문자 1개, 대문자 1개, 숫자 1개를 포함해야 합니다.',
  })
  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    message:
      '비밀번호는 최소 8자 이상이며, 특수문자 1개, 대문자 1개, 숫자 1개를 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  name: string;
}
