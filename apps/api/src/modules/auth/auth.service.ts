import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type MinimalUser = {
  id: string;
  email: string;
  orgId?: string | null;
};

type LoginDto = {
  id?: string;
  email: string;
  orgId?: string | null;
  password?: string;
};

type SignupDto = {
  id: string;
  email: string;
  orgId?: string | null;
  password?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  signToken(user: MinimalUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId ?? null,
    };
    return { access_token: this.jwt.sign(payload) };
  }

  // Minimal stubs so older controllers/tests compile even if not used.
  async login(dto: LoginDto) {
    return this.signToken({
      id: dto.id ?? 'user-id',
      email: dto.email,
      orgId: dto.orgId ?? null,
    });
  }

  async signup(dto: SignupDto) {
    // In real impl, create a user; here just return a token.
    return this.signToken({
      id: dto.id,
      email: dto.email,
      orgId: dto.orgId ?? null,
    });
  }

  me(user: any) {
    // Whatever JwtStrategy.validate returns becomes req.user
    return user;
  }
}