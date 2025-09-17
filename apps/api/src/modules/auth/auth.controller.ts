import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import AuthService from './auth.service'; // default import (matches your file)

type AuthDto = {
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(
    @Headers('x-org') org: string,
    @Body() dto: AuthDto,
  ) {
    return this.auth.signup({ org, email: dto.email, password: dto.password });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // tests expect 200 OK
  async login(
    @Headers('x-org') org: string,
    @Body() dto: AuthDto,
  ) {
    return this.auth.login({ org, email: dto.email, password: dto.password });
  }
}