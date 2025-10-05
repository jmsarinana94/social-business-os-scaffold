import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type SignupBody = { email: string; password: string; org?: string };
type LoginBody = { email: string; password: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupBody) {
    const payload = { email: body.email, password: body.password, org: body.org ?? 'org' };
    return this.auth.signup(payload);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() { email, password }: LoginBody) {
    return this.auth.login({ email, password });
  }

  @Get('me')
  @HttpCode(200)
  async me(@Headers('authorization') authz?: string) {
    return this.auth.meFromAuthorization(authz ?? '');
  }
}