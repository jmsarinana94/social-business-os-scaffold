import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

type SignupLoginBody = { email: string; password: string; org?: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /auth/signup -> 201 (default)
  @Post('signup')
  async signup(@Body() body: SignupLoginBody, @Req() req: Request & { orgSlug?: string }) {
    const org = body.org || req.orgSlug;
    return this.auth.signup(body.email, body.password, org);
  }

  // POST /auth/login -> 200 (tests expect OK, not Created)
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: SignupLoginBody, @Req() req: Request & { orgSlug?: string }) {
    const org = body.org || req.orgSlug;
    return this.auth.login(body.email, body.password, org);
  }

  // GET /auth/me -> return info straight from the verified JWT
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(200)
  me(@Req() req: any) {
    const { sub, email } = req.user ?? {};
    return { id: sub, email };
  }
}