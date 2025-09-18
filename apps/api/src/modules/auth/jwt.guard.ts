import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protect routes with:
 *   @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}