import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '@/generated/prisma/enums';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  // Servicio asignado por el staff al atender (para métricas). `null` lo desasigna.
  @IsOptional()
  @IsUUID('4', { each: false })
  serviceId?: string | null;

  // Nueva duración total en minutos (permite extender/acortar el turno).
  // `endsAt` se recalcula como `startsAt + durationMinutes`.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
