import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string | undefined;

  @IsOptional()
  @IsEmail()
  email?: string | undefined;
}
