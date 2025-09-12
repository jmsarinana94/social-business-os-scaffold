import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Headers('x-org') org?: string) {
    // AuthService expects primitives: (email, password, name, orgSlug)
    return this.auth.signup(dto.email, dto.password, dto.name ?? '', org ?? 'demo');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // tests expect 200
  async login(@Body() dto: LoginDto) {
    // AuthService expects primitives: (email, password)
    return this.auth.login(dto.email, dto.password);
  }
}