// apps/api/src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

type LoginDto = { email: string; password: string };
type RegisterDto = { email: string; password: string; name?: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password, body.name);
  }
}