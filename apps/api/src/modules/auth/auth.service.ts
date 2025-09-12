// apps/api/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(email: string, password: string, name: string, orgSlug: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash },
    });

    const org = await this.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (org) {
      await this.prisma.orgUser.create({
        data: { orgId: org.id, userId: user.id, role: 'admin' },
      });
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { access_token: token };
  }
}