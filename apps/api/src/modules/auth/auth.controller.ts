import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';

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
    // AuthService expects a single payload object
    return this.auth.signup({ org, email: dto.email, password: dto.password });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // ensure 200 OK (tests expect 200)
  async login(
    @Headers('x-org') org: string,
    @Body() dto: AuthDto,
  ) {
    // AuthService expects a single payload object
    return this.auth.login({ org, email: dto.email, password: dto.password });
  }
}