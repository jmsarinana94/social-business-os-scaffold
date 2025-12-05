// apps/api/src/modules/accounts/dto/create-account.dto.ts

import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  // Full URL, optional
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'website must be a valid URL' })
  @MaxLength(2048)
  website?: string;

  // Optional long-form notes/description
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}