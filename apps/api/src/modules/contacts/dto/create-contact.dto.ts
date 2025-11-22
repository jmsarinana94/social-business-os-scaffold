import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}