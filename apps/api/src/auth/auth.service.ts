// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * TEMP STUB (no Prisma):
 * - Uses a single demo user from env or defaults.
 * - Swap to Prisma once User/Membership models are added.
 *
 * Env (optional):
 *   AUTH_DEMO_EMAIL=founder@example.com
 *   AUTH_DEMO_PASSWORD=password123
 */
@Injectable()
export class AuthService {
  private readonly demoEmail = process.env.AUTH_DEMO_EMAIL ?? 'founder@example.com';
  private readonly demoPasswordHashPromise = bcrypt.hash(
    process.env.AUTH_DEMO_PASSWORD ?? 'password123',
    8,
  );

  constructor(private readonly jwt: JwtService) {}

  private async validateUser(email: string, password: string) {
    if (email !== this.demoEmail) return null;
    const hash = await this.demoPasswordHashPromise;
    const ok = await bcrypt.compare(password, hash);
    return ok ? { id: 'demo-user', email } : null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  async register(email: string, password: string, _name?: string) {
    // For now, “register” just returns a token; replace with Prisma later.
    const hash = await bcrypt.hash(password, 10);
    void hash; // placeholder
    const payload = { sub: 'demo-user', email };
    return { access_token: await this.jwt.signAsync(payload), note: 'stubbed register' };
  }
}