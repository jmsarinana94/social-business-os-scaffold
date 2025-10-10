import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}