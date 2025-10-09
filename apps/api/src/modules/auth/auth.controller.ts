import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

type SignupDto = { email: string; password: string; org?: string };
type LoginDto = { email: string; password: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto, @Headers('x-org') orgHeader?: string) {
    const org = body.org || orgHeader || 'demo';
    return this.auth.signup({ email: body.email, password: body.password, org });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Headers('x-org') orgHeader?: string) {
    const org = orgHeader || 'demo';
    return this.auth.login({ email: body.email, password: body.password, org });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async me(@Req() req: Request) {
    // Read from JWT payload set by the guard/strategy
    const anyReq = req as any;
    const user = anyReq?.user || {};
    return { id: user.sub || user.id, email: user.email };
  }
}