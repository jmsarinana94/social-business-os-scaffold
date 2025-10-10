import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Org } from '../../common/org.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  async signup(@Body() body: any, @Org() org?: { slug: string }) {
    const orgSlug = (org && org.slug) || body.org;
    if (!orgSlug) {
      throw new BadRequestException('org required (X-Org header or body.org)');
    }
    return this.auth.signup({ email: body.email, password: body.password, org: orgSlug });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any) {
    return this.auth.login({ email: body.email, password: body.password });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.auth.me({ userId: req.user.userId, email: req.user.email });
  }
}