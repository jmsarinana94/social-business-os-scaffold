import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

type SignupDto = {
  email: string;
  password: string;
  orgSlug?: string;
  orgName?: string;
};

type LoginDto = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ---- Helpers ----

  private async hashPassword(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  private async signToken(user: { id: string; email: string; orgId: string | null }) {
    // Include orgId so downstream services can resolve org context
    const payload = { sub: user.id, email: user.email, orgId: user.orgId ?? undefined };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  // ---- API methods ----

  async signup(dto: SignupDto) {
    const { email, password, orgSlug, orgName } = dto;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    let orgId: string | null = null;

    if (orgSlug) {
      // Ensure org exists (create if missing)
      const org = await this.prisma.organization.upsert({
        where: { slug: orgSlug },
        update: { updatedAt: new Date() },
        create: { slug: orgSlug, name: orgName ?? orgSlug },
        select: { id: true },
      });
      orgId = org.id;
    }

    const hashed = await this.hashPassword(password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashed,
          ...(orgId ? { org: { connect: { id: orgId } } } : {}),
        } as Prisma.UserCreateInput,
        select: { id: true, email: true, orgId: true },
      });

      if (orgId) {
        await this.ensureMembership(user.id, orgId, 'OWNER');
      }

      return this.signToken(user);
    } catch (err: unknown) {
      // Handle unique(email) conflict — return a token for the existing user
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await this.prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, orgId: true },
        });
        if (existing) return this.signToken(existing);
      }
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, orgId: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  async me() {
    return { ok: true };
  }

  // ---- Internal ----

  private async ensureMembership(
    userId: string,
    orgId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER',
  ) {
    // Works whether or not you have @@unique([userId, orgId]) on Membership
    const existing = await this.prisma.membership.findFirst({
      where: { userId, orgId },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.membership.create({
        data: {
          user: { connect: { id: userId } },
          org: { connect: { id: orgId } },
          role,
        },
      });
    }
  }
}