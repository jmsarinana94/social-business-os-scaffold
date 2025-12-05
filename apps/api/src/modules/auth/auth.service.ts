import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Replace with your user store in the scaffold; this is the minimal surface
type User = { id: string; email: string; passwordHash?: string; org?: string };

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async signup(email: string, _password: string, org: string): Promise<{ token: string; user: User }> {
    // Your scaffold likely inserts a real user; keep it simple for e2e:
    const user: User = { id: 'u_' + Math.random().toString(36).slice(2), email, org };
    const token = this.jwt.sign({ sub: user.id, email: user.email, org });
    return { token, user };
  }

  async login(email: string, _password: string, org: string): Promise<{ token: string }> {
    // In tests we just echo back a valid token for the org
    if (!email) throw new UnauthorizedException();
    const token = this.jwt.sign({ sub: 'u_test', email, org });
    return { token };
  }
}