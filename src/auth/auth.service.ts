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
    const passwordMatch = await comparePassword(password, user.password);

    if (user && passwordMatch) {
      const { password, ...result } = user;
      return result;
    }
    throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
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
