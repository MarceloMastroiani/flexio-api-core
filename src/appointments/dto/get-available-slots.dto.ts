import { IsDateString, IsUUID } from "class-validator";


export class GetAvailableSlotsDto {

  @IsUUID()
  employeeId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  date: string;
}
