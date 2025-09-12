// apps/api/src/modules/auth/dto/signup.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail() email!: string;
  @MinLength(6) password!: string;
  @IsNotEmpty() name!: string;
}