import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthRepository } from './auth.repository';
import { User } from '../../generated/prisma/client';
import {
  comparePassword,
  generateTemporaryPassword,
  hashPassword,
} from '../common/helpers/hash-password.helpers';
import { JwtService } from '@nestjs/jwt';
import { ProfileUser, SafeUser } from './dto/login-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type LoginUser = Pick<User, 'id' | 'email' | 'role'> & {
  mustChangePassword?: boolean;
  createdAt?: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  async validateUser(email: string, password: string): Promise<SafeUser> {
    const user = await this.authRepository.findOneByEmail(email);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const { password: _, ...result } = user;
    return result;
  }

  login(user: LoginUser) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword ?? false,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string): Promise<ProfileUser> {
    const user = await this.authRepository.findProfile(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      employeeId: user.employee?.id ?? null,
    };
  }

  async changeOwnPassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.authRepository.findOneWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    if (changePasswordDto.newPassword === changePasswordDto.currentPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta de la actual',
      );
    }

    const hashedPassword = await hashPassword(changePasswordDto.newPassword);
    await this.authRepository.updatePassword(userId, hashedPassword, false);

    // Token nuevo con mustChangePassword=false para que el RolesGuard permita seguir.
    return this.login({
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: false,
    });
  }

  async resetPassword(
    userId: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ temporaryPassword: string }> {
    const user = await this.authRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const temporaryPassword =
      resetPasswordDto.password?.trim() || generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);
    await this.authRepository.updatePassword(userId, hashedPassword, true);

    return { temporaryPassword };
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
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
