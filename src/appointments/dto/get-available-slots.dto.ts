import { IsDateString, IsUUID } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;
}
