import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

type Tokens = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtSvc: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      const user = await newUser.save();
      const { access_token, refresh_token } = await this.generateTokens(user);

      return {
        access_token,
        refresh_token,
        user: this.removePassword(user),
        status: HttpStatus.CREATED,
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 11000) {
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Please your credentials and try again',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async loginUser(email: string, password: string) {
    try {
      const user = await this.userModel.findOne({ email });
      const isPassWordValid = await bcrypt.compare(password, user.password);

      if (!isPassWordValid) {
        throw new HttpException(
          'Please your credentials and try again',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (user && isPassWordValid) {
        const payload = { sub: user._id, email: user.email, name: user.name };
        const { access_token, refresh_token } = await this.generateTokens(payload);

        return {
          access_token,
          refresh_token,
          user: this.removePassword(user),
          message: 'Login successful',
        };
      }
    } catch (error) {
      throw new HttpException(
        'Please your credentials and try again',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const user = this.jwtSvc.verify(refreshToken, {
        secret: 'jwt_secret_refresh',
      });

      const payload = { sub: user._id, email: user.email, name: user.name };
      const { access_token, refresh_token } =
        await this.generateTokens(payload);
      return {
        access_token,
        refresh_token,
        status: 200,
        message: 'Refresh token succesfully',
      };
    } catch (error) {
      throw new HttpException('Refresh token failed', HttpStatus.UNAUTHORIZED);
    }
  }

  private async generateTokens(user): Promise<Tokens> {
    const jwtpayload = { sub: user._id, email: user.email, name: user.name };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtSvc.signAsync(jwtpayload, {
        secret: 'jwt_secret',
        expiresIn: '1d',
      }),

      this.jwtSvc.signAsync(jwtpayload, {
        secret: 'jwt_secret_refresh',
        expiresIn: '7d',
      }),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private removePassword(user) {
    const { password, ...rest } = user.toObject();
    return rest;
  }
}
