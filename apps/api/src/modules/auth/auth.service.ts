import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(email: string, password: string, org?: string) {
    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      // idempotent: if user exists, just return a token via login
      return this.login(email, password);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    const access_token = await this.sign(user.id, user.email, org);
    return { access_token, token: access_token };
  }

  async login(email: string, password: string, org?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const access_token = await this.sign(user.id, user.email, org);
    return { access_token, token: access_token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email };
  }

  private async sign(sub: string, email: string, org?: string) {
    // keep payload minimal; org is optional hint, not required by strategy
    return this.jwt.signAsync({ sub, email, org });
  }
}