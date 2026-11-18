import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '../../../generated/prisma/client';

export class CreateAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsEnum(Role)
  role!: Role;
}
