import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email?.toLowerCase()?.trim();
    if (!email || !dto.password) {
      throw new BadRequestException('email and password are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: true, message: 'User already exists' };

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // ensure org
    let org = await this.prisma.org.findUnique({ where: { slug: dto.orgSlug } });
    if (!org) {
      org = await this.prisma.org.create({ data: { slug: dto.orgSlug, name: dto.orgName } });
    }

    await this.prisma.user.create({
      data: { email, passwordHash, name: dto.name ?? null, orgId: org.id },
    });

    return { ok: true };
  }

  async login(dto: LoginDto) {
    const email = dto.email?.toLowerCase()?.trim();
    const password = dto.password;
    if (!email || !password) throw new BadRequestException('email and password are required');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}
