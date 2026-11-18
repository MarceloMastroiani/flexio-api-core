import { IsEmail, IsString } from 'class-validator';
import { User } from '../../../generated/prisma/client';

export type SafeUser = Omit<User, 'password'>;

export class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  password!: string;
}
