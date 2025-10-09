import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';

export const ORG_HEADER = 'x-org';

export const OrgHeader = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    const v =
      req.headers[ORG_HEADER] ||
      req.headers[ORG_HEADER.toUpperCase()] ||
      req.headers['x-org-id'] ||
      req.headers['X-Org-Id'];
    return typeof v === 'string' ? v : undefined;
  },
);

export enum ProductTypeDto {
  PHYSICAL = 'PHYSICAL',
  SERVICE = 'SERVICE',
}

export enum ProductStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @IsString()
  // allow upper/lower letters, digits, -, _, . ; 3–64 chars
  @Matches(/^[A-Za-z0-9._-]{3,64}$/)
  sku!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ProductTypeDto)
  type?: ProductTypeDto;

  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryQty?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ProductTypeDto)
  type?: ProductTypeDto;

  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryQty?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{3,64}$/)
  sku?: string;
}