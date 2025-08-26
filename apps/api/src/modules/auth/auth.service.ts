import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Register a user into a given org (x-org header value).
   * - Ensures the org exists.
   * - Creates the user if not present.
   * - Links a Membership (OWNER on first registration for that user in that org).
   */
  async register(orgId: string, dto: RegisterDto) {
    if (!orgId) throw new BadRequestException('Missing org header (x-org)');

    // Ensure the org exists
    await this.prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: { id: orgId, name: orgId, slug: orgId },
    });

    // Email uniqueness check
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Create user
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    // Link membership if not present
    const membership = await this.prisma.membership.findFirst({
      where: { orgId, userId: user.id },
    });
    if (!membership) {
      // Use raw string for role to avoid enum typing drift between Prisma versions
      await this.prisma.membership.create({
        data: { orgId, userId: user.id, role: 'OWNER' as any },
      });
    }

    return { user };
  }

  /**
   * Login a user within an org (requires they have membership to that org).
   * Returns JWT access_token.
   */
  async login(orgId: string, dto: LoginDto) {
    if (!orgId) throw new BadRequestException('Missing org header (x-org)');

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, (user as any).passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { orgId, userId: user.id },
      select: { role: true },
    });
    if (!membership) {
      throw new UnauthorizedException('No access to this organization');
    }

    const payload = { sub: user.id, email: user.email, orgId, role: membership.role };
    const access_token = await this.jwt.signAsync(payload);

    return { access_token };
  }
}