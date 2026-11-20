import { IsNotEmpty, IsString } from 'class-validator';

export class PublicPhoneQueryDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
