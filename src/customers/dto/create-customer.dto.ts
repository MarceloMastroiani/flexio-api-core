import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @ValidateIf((dto) => !dto.email)
  @IsNotEmpty({ message: 'Debe proporcionar teléfono o email' })
  @IsString()
  phone?: string;

  @ValidateIf((dto) => !dto.phone)
  @IsNotEmpty({ message: 'Debe proporcionar teléfono o email' })
  @IsString()
  email?: string;
}
