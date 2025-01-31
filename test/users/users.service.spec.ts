import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../../src/modules/users/dto/update-user.dto';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { UserRepository } from '../../src/modules/users/repositories/user.repository';
import { UsersService } from '../../src/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UserRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findUserWithEmail: jest.fn(),
    findUserWithId: jest.fn(),
    delete: jest.fn()
  };

  const expectedUser: User = {
    id: '1',
    email: 'test@example.com',
    name: '홍길동',
    password: 'Password123!',
    role: UserRole.USER,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn()
  };

  const expectedUsers = [
    {
      id: '1',
      email: 'test1@example.com',
      name: '홍길동',
      password: 'Password123!',
      role: UserRole.USER,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: jest.fn()
    },
    {
      id: '2',
      email: 'test2@example.com',
      name: '김철수',
      password: 'Password123!',
      role: UserRole.USER,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: jest.fn()
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UserRepository);
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'Test123!@',
      name: '홍길동'
    };

    it('should create a new user if email does not exist', async () => {
      repository.findUserWithEmail.mockResolvedValue(null);
      repository.create.mockReturnValue(expectedUser);
      repository.save.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(repository.findUserWithEmail).toHaveBeenCalledWith(
        createUserDto.email
      );
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
    });

    it('should throw ConflictException if email exists', async () => {
      repository.findUserWithEmail.mockResolvedValue({
        id: '1',
        ...createUserDto,
        role: UserRole.USER,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn()
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
      expect(repository.findUserWithEmail).toHaveBeenCalledWith(
        createUserDto.email
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if exists', async () => {
      repository.findUserWithId.mockResolvedValue(expectedUser);

      const result = await service.findOne('1');

      expect(result).toEqual(expectedUser);
      expect(repository.findUserWithId).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findUserWithId.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(repository.findUserWithId).toHaveBeenCalledWith('1');
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      repository.find.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      repository.findUserWithEmail.mockResolvedValue(expectedUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(expectedUser);
      expect(repository.findUserWithEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should return null if email does not exist', async () => {
      repository.findUserWithEmail.mockResolvedValue(null);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeNull();
      expect(repository.findUserWithEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: '홍길동2'
    };

    it('should update and return user if exists', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        name: '홍길동',
        password: 'password',
        role: UserRole.USER,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn()
      };
      const updatedUser = { ...existingUser, ...updateUserDto };
      repository.findUserWithId.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(repository.findUserWithId).toHaveBeenCalledWith('1');
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findUserWithId.mockResolvedValue(null);

      await expect(service.update('1', updateUserDto)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.findUserWithId).toHaveBeenCalledWith('1');
    });
  });

  describe('remove', () => {
    it('should remove user if exists', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith('1');
    });
  });
});
