import {
  IsArray,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TimeRangeDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start debe tener formato HH:mm',
  })
  start!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end debe tener formato HH:mm',
  })
  end!: string;
}

export class DayAvailabilityDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  mon?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  tue?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  wed?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  thu?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  fri?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  sat?: TimeRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  sun?: TimeRangeDto[];
}

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  // Opcional: si no se envía, se usa el email del usuario vinculado.
  @IsOptional()
  @IsString()
  email?: string | undefined;

  // Duración por defecto del turno del empleado (en minutos).
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  slotMinutes?: number | undefined;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  availability!: DayAvailabilityDto;
}
