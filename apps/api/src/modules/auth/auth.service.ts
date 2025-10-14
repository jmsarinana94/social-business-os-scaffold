import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Issue a JWT that your existing JwtStrategy should accept.
   * Keep payload minimal and stable: { sub, email }
   */
  async issueToken(user: { email: string; id?: string }) {
    const payload = {
      sub: user.id ?? user.email, // fall back to email as subject if no id
      email: user.email,
    };
    return this.jwt.signAsync(payload);
  }
}