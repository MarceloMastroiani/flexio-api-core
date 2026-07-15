import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthRepository } from './auth.repository';
import { User } from 'generated/prisma/client';
import { comparePassword } from '../common/helpers/hash-password.helpers';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.authRepository.findOneByEmail(email);
    if (!user) {
       throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

    const { password: _ , ...result } = user;
    return result;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // ============================================================
  // USER
  // ============================================================
  async createUser(createAuthDto: CreateAuthDto) {
    const newUser = await this.authRepository.create(createAuthDto);

    if (!newUser) {
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return newUser;
  }

  async findAllUsers() {
    const users = await this.authRepository.findAll();

    if (!users) {
      throw new HttpException(
        'Failed to find users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return users;
  }

  async findOneUser(id: string) {
    const user = await this.authRepository.findOne(id);

    if (!user) {
      throw new HttpException(
        'Failed to find user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user;
  }
}
