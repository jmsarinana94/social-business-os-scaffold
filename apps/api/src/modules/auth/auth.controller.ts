import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup') // Nest default 201 (tests expect 201)
  async signup(@Body() body: any) {
    const { email, password, org } = body || {};
    return this.auth.signup(email, password, org || 'default-org');
  }

  @Post('login')
  @HttpCode(200) // tests expect 200 for login
  async login(@Body() body: any) {
    const { email, password, org } = body || {};
    const { token } = await this.auth.login(email, password, org || 'default-org');
    // Return both keys — tests sometimes look for either
    return { access_token: token, token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    // tests expect the fields at the root (not nested under "user")
    return { id: req.user?.sub, email: req.user?.email, org: req.user?.org };
  }
}