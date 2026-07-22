import { IsNumber, IsString, IsDecimal } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceDto {

  @IsString()
  name: string;

  @IsNumber()
  duration: number;

  @IsNumber()
  price: number;

}
