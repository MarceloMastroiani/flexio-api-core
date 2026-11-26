import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayAvailabilityDto } from './create-employee.dto';

/**
 * Alta de empleado en un solo paso: crea el User (rol STAFF) + Employee.
 * Si no se envía password, el backend genera una temporal.
 */
export class CreateEmployeeWithUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  slotMinutes?: number;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  availability!: DayAvailabilityDto;
}
