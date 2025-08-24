import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: name ?? email.split('@')[0],
        passwordHash: hashed,
      },
      select: { id: true, email: true, name: true },
    });

    return { user };
  }

  async login(email: string, password: string) {
    const found = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!found) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, found.passwordHash ?? '');
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // No orgId in your User schema yet — default to 'demo' for now
    const payload = { sub: found.id, email: found.email, orgId: 'demo' };
    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      user: { id: found.id, email: found.email, name: found.name },
    };
  }
}