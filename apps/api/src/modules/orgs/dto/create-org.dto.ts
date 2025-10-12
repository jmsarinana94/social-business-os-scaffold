import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, or dashes' })
  @MaxLength(50)
  slug!: string;

  @IsString()
  @MaxLength(100)
  name!: string;
}