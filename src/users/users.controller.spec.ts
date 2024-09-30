import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpStatus } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            loginUser: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should register a user', async () => {
      const createUserDto: CreateUserDto = { name: 'John', email: 'john@example.com', password: 'password123' };
      const result = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        user: { name: 'John', email: 'john@example.com' },
        status: HttpStatus.CREATED,
        message: 'User created successfully',
      };

      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create(createUserDto)).toEqual(result);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const createUserDto: CreateUserDto = { name: 'John', email: 'john@example.com', password: 'password123' };
      const result = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        user: { name: 'John', email: 'john@example.com' },
        message: 'Login successful',
      };

      jest.spyOn(service, 'loginUser').mockResolvedValue(result);

      expect(await controller.login(createUserDto)).toEqual(result);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const result = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        status: 200,
        message: 'Refresh token successfully',
      };

      jest.spyOn(service, 'refreshToken').mockResolvedValue(result);

      const request = { headers: { authorization: 'Bearer refreshToken' } } as any;
      expect(await controller.refreshTokens(request)).toEqual(result);
    });
  });
});