import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'dev_secret_change_me',
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Whatever you return here becomes req.user
    return { userId: payload.sub, email: payload.email };
  }
}