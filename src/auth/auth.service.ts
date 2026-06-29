import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthRepository } from './auth.repository';
import { User } from 'generated/prisma/client';
import { comparePassword } from '../common/helpers/hash-password.helpers';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  async login(email: string, password: string): Promise<User> {
    const user = await this.authRepository.findOneByEmail(email);

    if (!user || !(await comparePassword(password, user.password))) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  // ============================================================
  // USER
  // ============================================================
  async createUser(createAuthDto: CreateAuthDto) {
    return this.authRepository.create(createAuthDto);
  }

  async findAllUsers() {
    return this.authRepository.findAll();
  }

  async findOneUser(id: string) {
    return this.authRepository.findOne(id);
  }
}
