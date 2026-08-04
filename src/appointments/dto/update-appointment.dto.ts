import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '@/generated/prisma/enums';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
