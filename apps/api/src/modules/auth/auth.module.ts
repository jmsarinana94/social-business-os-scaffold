import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}