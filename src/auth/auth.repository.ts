import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';

import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, User } from '../../generated/prisma/client';

import { hashPassword } from '../common/helpers/hash-password.helpers';

// Campos de usuario que se pueden exponer por API (nunca el hash de password).
const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  mustChangePassword: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const profileUserSelect = {
  id: true,
  email: true,
  role: true,
  mustChangePassword: true,
  employee: { select: { id: true } },
} satisfies Prisma.UserSelect;

export type SafeUserRow = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

export type ProfileUserRow = Prisma.UserGetPayload<{
  select: typeof profileUserSelect;
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAuthDto: CreateAuthDto): Promise<SafeUserRow> {
    const { email, password, role } = createAuthDto;

    return this.prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        role,
      },
      select: safeUserSelect,
    });
  }

  async findAll(): Promise<SafeUserRow[]> {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<SafeUserRow | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async findProfile(id: string): Promise<ProfileUserRow | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: profileUserSelect,
    });
  }

  /** Solo para validar la contraseña actual en el cambio de clave. */
  async findOneWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Find a user by email (incluye el hash para el login)
  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updatePassword(
    id: string,
    hashedPassword: string,
    mustChangePassword: boolean,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword },
    });
  }
}
