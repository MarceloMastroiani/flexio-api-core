import { PaymentMethod } from "@/generated/prisma/client";
import { IsString, IsOptional, IsEnum, IsNumber } from "class-validator";

export class CreateCashDto {

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}
