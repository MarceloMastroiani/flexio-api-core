import { IsEmail, IsString } from 'class-validator';
import { Role, User } from '../../../generated/prisma/client';

export type SafeUser = Omit<User, 'password'>;

export interface ProfileUser {
  userId: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  employeeId: string | null;
}

export class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  password!: string;
}
