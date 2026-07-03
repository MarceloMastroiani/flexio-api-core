import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';

import { PrismaService } from '../common/prisma/prisma.service';
import { User } from 'generated/prisma/client';

import { hashPassword } from '../common/helpers/hash-password.helpers';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAuthDto: CreateAuthDto): Promise<User> {
    const { email, password, role } = createAuthDto;

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        role,
      },
    });

    return newUser;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();

    return users;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  // Find a user by email
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException(
        'Failed to find user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user;
  }
}
