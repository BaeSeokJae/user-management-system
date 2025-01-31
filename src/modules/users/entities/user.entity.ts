import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    length: 255 // 이메일 해시값 길이 고려
  })
  email: string;

  @Column({
    length: 60 // bcrypt 해시 길이는 60자
  })
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  // 이메일 검증을 위한 필드 추가
  @Column({
    default: false
  })
  isEmailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // 비밀번호가 변경되었을 때만 해시화
    if (this.password && !this.password.match(/^\$2[ayb]\$.{56}$/)) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
