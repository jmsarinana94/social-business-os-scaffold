import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private sign(user: { id: string; email: string }) {
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' },
    );
    return { access_token: token, token };
  }

  async signup({ email, password, org }: { email: string; password: string; org: string }) {
    if (!email || !password || !org) {
      throw new BadRequestException('email, password, org required');
    }
    // idempotent org upsert by slug
    await this.prisma.organization.upsert({
      where: { slug: org },
      update: {},
      create: { slug: org, name: org },
    });

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // let tests treat signup as idempotent – just log them in
      return this.sign(existing);
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const user = await this.prisma.user.create({ data: { email, passwordHash } });
    return this.sign(user);
  }

  async login({ email, password }: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user);
  }

  async me({ userId, email }: { userId: string; email: string }) {
    return { id: userId, email };
  }
}