import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'test-secret',
    });
  }

  // Whatever you return here becomes req.user
  async validate(payload: { sub: string; email: string; orgId?: string }) {
    return { userId: payload.sub, email: payload.email, orgId: payload.orgId ?? 'demo' };
  }
}