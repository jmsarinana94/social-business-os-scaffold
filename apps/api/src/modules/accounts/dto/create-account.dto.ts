import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'website must be a URL' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}