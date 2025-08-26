import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Headers('x-org') orgId?: string) {
    const result = await this.auth.register(dto, orgId || 'demo');
    return { user: { id: result.user.id, email: result.user.email, name: result.user.name } };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Headers('x-org') orgId?: string) {
    return this.auth.login(dto, orgId || 'demo');
  }
}