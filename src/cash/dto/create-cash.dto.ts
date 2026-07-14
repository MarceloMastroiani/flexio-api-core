import { IsString, IsOptional } from "class-validator";

export class CreateCashDto {

  @IsString()
  amount: number;

  @IsString()
  method: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
