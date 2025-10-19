import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const { email, password } = body ?? {};
    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }
    const token = await this.auth.issueToken({ email });
    return { access_token: token };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    // req.user is populated by JwtStrategy.validate
    const user = req.user ?? {};
    return { id: user.sub ?? user.id ?? 'me', email: user.email ?? null };
  }
}