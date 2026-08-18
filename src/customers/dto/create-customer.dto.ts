import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Debe proporcionar teléfono y email' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Debe proporcionar teléfono y email' })
  @IsString()
  email: string;
}
