import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto, orgId: string) {
    // ensure org exists
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      await this.prisma.organization.create({ data: { id: orgId, name: orgId, slug: orgId } });
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    // ensure membership
    const membership = await this.prisma.membership.findFirst({
      where: { orgId, userId: user.id },
    });
    if (!membership) {
      await this.prisma.membership.create({
        data: { orgId, userId: user.id, role: 'OWNER' as any },
      });
    }

    return { user };
  }

  async login(dto: LoginDto, orgId: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const membership = await this.prisma.membership.findFirst({
      where: { orgId, userId: user.id },
    });
    if (!membership) throw new UnauthorizedException('No org access');

    const payload = { sub: user.id, orgId, role: membership.role, email: user.email };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}