import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub: string;            // user id
  email: string;
  orgId?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-super-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Whatever we return here becomes req.user
    return payload;
  }
}