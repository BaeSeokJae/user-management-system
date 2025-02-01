import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../../src/modules/users/dto/update-user.dto';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { UserRepository } from '../../src/modules/users/repositories/user.repository';
import { UsersService } from '../../src/modules/users/users.service';
import {
  cleanupTestConnection,
  createTestDataSource
} from '../test-database.module';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;
  let dataSource: DataSource;

  const createUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'Test123!@',
    name: '홍길동'
  };

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => {
            return new UserRepository(dataSource);
          }
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    await cleanupTestConnection(dataSource);
  });

  describe('create', () => {
    it('should create a new user if email does not exist', async () => {
      // When
      const result = await service.create(createUserDto);

      // Then
      expect(result.email).toBe(createUserDto.email);
      expect(result.name).toBe(createUserDto.name);
      expect(result.role).toBe(UserRole.USER);
    });

    it('should throw ConflictException if email exists', async () => {
      // Given
      await service.create(createUserDto);

      // When & Then
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if exists', async () => {
      // Given
      const createdUser = await service.create(createUserDto);

      // When
      const result = await service.findOne(createdUser.id);

      // Then
      expect(result.id).toBe(createdUser.id);
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      await expect(service.findOne(randomUUID())).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      // Given
      await service.create(createUserDto);
      await service.create({
        email: 'test2@example.com',
        password: 'Test123!@',
        name: '김철수'
      });

      // When
      const result = await service.findAll();

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe(createUserDto.email);
      expect(result[1].email).toBe('test2@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      // Given
      const createdUser = await service.create(createUserDto);

      // When
      const result = await service.findByEmail(createUserDto.email);

      // Then
      expect(result.id).toBe(createdUser.id);
      expect(result.email).toBe(createUserDto.email);
    });

    it('should return null if email does not exist', async () => {
      // When
      const result = await service.findByEmail('nonexistent@example.com');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: '홍길동2'
    };

    it('should update and return user if exists', async () => {
      // Given
      const createdUser = await service.create(createUserDto);

      // When
      const result = await service.update(createdUser.id, updateUserDto);

      // Then
      expect(result.id).toBe(createdUser.id);
      expect(result.name).toBe(updateUserDto.name);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      await expect(service.update(randomUUID(), updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove user if exists', async () => {
      // Given
      const createdUser = await service.create(createUserDto);

      // When
      await service.remove(createdUser.id);

      // Then
      await expect(service.findOne(createdUser.id)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      await expect(service.remove(randomUUID())).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
