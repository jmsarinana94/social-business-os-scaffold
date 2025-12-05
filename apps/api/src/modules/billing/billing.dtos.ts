import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class EnsureCustomerDto {
  @ApiProperty({ example: 'acme-inc', description: 'Organization slug' })
  @IsString()
  orgSlug!: string;

  @ApiProperty({ example: 'Acme Inc', required: false })
  @IsOptional()
  @IsString()
  orgName?: string;

  @ApiProperty({ example: 'owner@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CheckoutSessionDto {
  @ApiProperty({ example: 'acme-inc', description: 'Organization slug' })
  @IsString()
  orgSlug!: string;

  @ApiProperty({ example: 'price_123', description: 'Stripe Price ID (recurring)' })
  @IsString()
  priceId!: string;

  @ApiProperty({ example: 'https://app.example.com/billing/success' })
  @IsUrl()
  successUrl!: string;

  @ApiProperty({ example: 'https://app.example.com/billing/cancel' })
  @IsUrl()
  cancelUrl!: string;

  @ApiProperty({ example: 'owner@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: true, required: false, description: 'Return stub response if Stripe is not configured' })
  @IsOptional()
  @IsBoolean()
  // not used by service directly, but handy for future toggles
  stubOk?: boolean;
}