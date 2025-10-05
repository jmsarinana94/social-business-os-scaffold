import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  // Optional: tests sometimes omit this
  @IsOptional()
  @IsString()
  @MinLength(1)
  org?: string;
}