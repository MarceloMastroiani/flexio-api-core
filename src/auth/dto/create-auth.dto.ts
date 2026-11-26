import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../generated/prisma/client';

export class CreateAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;
}
