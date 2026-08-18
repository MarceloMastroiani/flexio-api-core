import { ArrayMinSize, IsArray, IsDateString, IsUUID } from "class-validator";
import { Transform } from "class-transformer";


export class GetAvailableSlotsDto {

  @IsUUID()
  employeeId: string;

  @Transform(({ value }) =>
    value == null
      ? undefined
      : Array.isArray(value)
        ? value
        : String(value).split(',').map((id) => id.trim()).filter(Boolean),
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsDateString()
  date: string;
}
