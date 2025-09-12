// src/modules/auth/auth.service.ts
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(email: string, password: string, name: string, orgSlug: string) {
    const hash = await bcrypt.hash(password, 10);

    const org = await this.prisma.organization.upsert({
      where: { slug: orgSlug },
      create: { slug: orgSlug, name: orgSlug.toUpperCase() },
      update: {},
    });

    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email, name, password: hash },
      update: {},
    });

    await this.prisma.orgUser.upsert({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
      create: { orgId: org.id, userId: user.id, role: 'ADMIN' },
      update: {},
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}