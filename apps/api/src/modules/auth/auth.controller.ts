// apps/api/src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
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
  constructor(private readonly authService: AuthService) {}

  private resolveOrg(fromBody?: string, fromHeader?: string): string {
    return (
      fromBody ||
      fromHeader ||
      process.env.E2E_ORG_SLUG ||
      'demo'
    );
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() body: any,
    @Headers('x-org') orgHeader?: string,
  ) {
    const { email, password, org } = body ?? {};
    const orgSlug = this.resolveOrg(org, orgHeader);

    const { token, user } = await this.authService.signup(
      email,
      password,
      orgSlug,
    );

    // Expose both "token" and "access_token" to satisfy all tests
    return {
      token,
      access_token: token,
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Headers('x-org') orgHeader?: string,
  ) {
    const { email, password, org } = body ?? {};
    const orgSlug = this.resolveOrg(org, orgHeader);

    const { token } = await this.authService.login(
      email,
      password,
      orgSlug,
    );

    // Again, keep both keys
    return {
      token,
      access_token: token,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    // JwtAuthGuard should attach the user to req.user
    return req.user;
  }
}