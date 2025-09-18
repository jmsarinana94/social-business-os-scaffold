import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

type Creds = { org: string; email: string; password: string };
type Signup = Creds;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private jwtSecret() {
    return process.env.JWT_SECRET ?? 'dev-super-secret';
  }
  private jwtExpires() {
    return process.env.JWT_EXPIRES_IN ?? '1d';
  }

  private async ensureOrg(slug: string) {
    const s = slug.toLowerCase();
    return this.prisma.organization.upsert({
      where: { slug: s },
      update: {},
      create: { slug: s, name: s },
    });
  }

  private signToken(payload: { sub: string; email: string; orgId?: string }) {
    return this.jwt.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: this.jwtExpires(),
    });
  }

  async signup({ org, email, password }: Signup) {
    const orgRow = await this.ensureOrg(org);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      const token = await this.signToken({
        sub: existing.id,
        email: existing.email,
        orgId: orgRow.id,
      });
      await this.prisma.orgMember.upsert({
        where: { userId_orgId: { userId: existing.id, orgId: orgRow.id } },
        update: {},
        create: { userId: existing.id, orgId: orgRow.id, role: 'MEMBER' },
      });
      return token;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hash = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: { email, password: hash },
    });

    await this.prisma.orgMember.upsert({
      where: { userId_orgId: { userId: user.id, orgId: orgRow.id } },
      update: {},
      create: { userId: user.id, orgId: orgRow.id, role: 'MEMBER' },
    });

    return this.signToken({ sub: user.id, email: user.email, orgId: orgRow.id });
  }

  async login({ org, email, password }: Creds) {
    const orgRow = await this.ensureOrg(org);

    let user = await this.prisma.user.findUnique({ where: { email } });

    // If user not found, but creds match seed env, create the seed user on the fly.
    const seedEmail = process.env.API_EMAIL || '';
    const seedPass = process.env.API_PASS || '';
    if (!user && email === seedEmail && password === seedPass) {
      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
      const hash = await bcrypt.hash(password, saltRounds);
      user = await this.prisma.user.create({ data: { email, password: hash } });
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.orgMember.upsert({
      where: { userId_orgId: { userId: user.id, orgId: orgRow.id } },
      update: {},
      create: { userId: user.id, orgId: orgRow.id, role: 'MEMBER' },
    });

    return this.signToken({ sub: user.id, email: user.email, orgId: orgRow.id });
  }

  async me({
    org,
    userId,
    email,
  }: {
    org: string;
    userId?: string;
    email?: string;
  }) {
    const where =
      userId != null
        ? { id: userId }
        : email != null
        ? { email }
        : null;

    if (!where) throw new UnauthorizedException('No user in JWT');

    const user = await this.prisma.user.findUnique({
      where,
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const orgRow = await this.ensureOrg(org);
    await this.prisma.orgMember.findUniqueOrThrow({
      where: { userId_orgId: { userId: user.id, orgId: orgRow.id } },
    });

    return user;
  }
}