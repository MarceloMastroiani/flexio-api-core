import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  /** Si no se envía, el backend genera una contraseña temporal. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
