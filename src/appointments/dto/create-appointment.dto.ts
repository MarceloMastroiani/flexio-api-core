import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export interface CreateAppointmentParams {
  employeeId: string;
  customerId: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
}

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  employeeId: string;

  // Duración del turno en minutos. Si no se envía, se usa el slotMinutes del empleado.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
