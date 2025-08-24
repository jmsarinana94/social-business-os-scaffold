import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type LoginDto = { email: string; password: string };
type RegisterDto = { email: string; password: string; name?: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Tests currently expect 201 from login, so we match that.
  @Post('login')
  @HttpCode(201)
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  // Register a new user (201 Created)
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password, body.name);
  }

  // Some tests use /auth/signup alias — keep it wired to register()
  @Post('signup')
  signup(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password, body.name);
  }
}