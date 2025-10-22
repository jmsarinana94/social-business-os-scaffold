import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // tests run fast; set false for prod
      secretOrKey: process.env.JWT_SECRET || 'test-secret',
    });
  }

  async validate(payload: any) {
    // Make the token payload available as req.user
    return payload;
  }
}