import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt.guard';

type SignupDto = { email: string; password: string };
type LoginDto = { email: string; password: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signup(
    @Headers('x-org') org: string | undefined,
    @Body() dto: SignupDto,
  ) {
    const token = await this.auth.signup({
      org: org || 'demo',
      email: dto.email,
      password: dto.password,
    });
    return { access_token: token };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Headers('x-org') org: string | undefined,
    @Body() dto: LoginDto,
  ) {
    const token = await this.auth.login({
      org: org || 'demo',
      email: dto.email,
      password: dto.password,
    });
    return { access_token: token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Headers('x-org') org: string | undefined,
    @CurrentUser('sub') userId: string | undefined,
    @CurrentUser('email') emailFromJwt: string | undefined,
  ) {
    const orgSlug = org || 'demo';
    return this.auth.me({ org: orgSlug, userId, email: emailFromJwt });
  }
}