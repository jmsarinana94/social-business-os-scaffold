// apps/api/src/modules/auth/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * POST /auth/signup
   * Keep default 201 Created (tests expect 201)
   */
  @Post('signup')
  async signup(@Body() body: any) {
    const { email, password, org } = body ?? {};
    return this.auth.signup(email, password, org || 'default-org');
  }

  /**
   * POST /auth/login
   * Tests expect 200 OK for login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { email, password, org } = body ?? {};
    const { token } = await this.auth.login(
      email,
      password,
      org || 'default-org',
    );
    // Return both keys for compatibility with different tests/clients
    return { access_token: token, token };
  }

  /**
   * GET /auth/me
   * Must return root-level fields (id, email, org)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return {
      id: req.user?.sub,
      email: req.user?.email,
      org: req.user?.org,
    };
    }
}