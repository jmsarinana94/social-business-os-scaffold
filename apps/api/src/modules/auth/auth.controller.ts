import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(@Headers('x-org') org: string, @Body() dto: AuthDto) {
    // Sign up returns 201 Created (default) which the tests expect.
    return this.auth.signup(org, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // <-- Make login return 200 instead of 201
  async login(@Headers('x-org') org: string, @Body() dto: AuthDto) {
    return this.auth.login(org, dto.email, dto.password);
  }
}
