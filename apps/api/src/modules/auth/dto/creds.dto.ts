import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class Creds {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  // Allow org in body so tests that send it don't 400
  @IsOptional()
  @IsString()
  org?: string;
}

export type MeQuery = { userId: string; email: string };