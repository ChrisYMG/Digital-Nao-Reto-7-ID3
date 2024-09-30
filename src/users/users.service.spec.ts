import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let jwtService: JwtService;
  let userModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    userModel = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and return tokens', async () => {
      const createUserDto: CreateUserDto = { name: 'John', email: 'john@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = { ...createUserDto, password: hashedPassword, save: jest.fn().mockResolvedValue(createUserDto) };

      jest.spyOn(userModel, 'constructor').mockReturnValue(user);
      jest.spyOn(user, 'save').mockResolvedValue(user);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        user: { name: 'John', email: 'john@example.com' },
        status: HttpStatus.CREATED,
        message: 'User created successfully',
      });
    });
  });

  describe('loginUser', () => {
    it('should login a user and return tokens', async () => {
      const createUserDto: CreateUserDto = { name: 'John', email: 'john@example.com', password: 'password123' };
      const user = { ...createUserDto, password: await bcrypt.hash(createUserDto.password, 10) };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');

      const result = await service.loginUser(createUserDto.email, createUserDto.password);

      expect(result).toEqual({
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        user: { name: 'John', email: 'john@example.com' },
        message: 'Login successful',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const user = { _id: '1', email: 'john@example.com', name: 'John' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(user);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');

      const result = await service.refreshToken('refreshToken');

      expect(result).toEqual({
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        status: 200,
        message: 'Refresh token succesfully',
      });
    });
  });
});