import { IsUUID, IsDateString, IsOptional, IsString, IsArray, ArrayMinSize } from 'class-validator';

export interface CreateAppointmentParams {
  employeeId: string;
  customerId: string;
  serviceIds: string[];
  startsAt: Date;
  endsAt: Date;
  notes?: string;
}

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  employeeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  serviceIds: string[];

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
