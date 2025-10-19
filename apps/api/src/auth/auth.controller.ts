import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: { email: string; password: string; org?: string }) {
    return this.auth.signup(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return this.auth.login(dto);
  }
}