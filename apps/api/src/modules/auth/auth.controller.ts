import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Tests expect 200 for /auth/login
  @HttpCode(200)
  @Post('login')
  login(@Body() body: any) {
    return this.auth.login(body);
  }

  // Tests expect 201 for /auth/signup (default Nest behavior), so NO @HttpCode here
  @Post('signup')
  signup(@Body() body: any) {
    return this.auth.signup(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user);
  }
}