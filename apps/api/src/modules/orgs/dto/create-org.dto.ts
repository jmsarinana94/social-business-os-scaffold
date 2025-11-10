import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  // simple, lowercase/number/dash slugs
  @Matches(/^[a-z0-9-]{3,}$/)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}