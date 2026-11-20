import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../../../generated/prisma/enums';

export class FindAppointmentsQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string | undefined;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string | undefined;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus | undefined;

  @IsOptional()
  @IsUUID()
  employeeId?: string | undefined;

  @IsOptional()
  @IsUUID()
  serviceId?: string | undefined;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  withoutService?: boolean | undefined;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string | undefined;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number | undefined;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number | undefined;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' | undefined;
}
