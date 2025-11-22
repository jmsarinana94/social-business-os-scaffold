// apps/api/src/modules/categories/categories.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  private requireOrgSlug(xOrg: string | undefined) {
    const slug = xOrg ?? '';
    if (!slug) throw new NotFoundException('X-Org header (org slug) is required');
    return slug;
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for categories module' })
  health() {
    return { ok: true, scope: 'categories' };
  }

  @Get()
  async list(@Headers('x-org') xOrg: string | undefined) {
    const slug = this.requireOrgSlug(xOrg);
    return this.categories.list(slug);
  }

  @Get(':id')
  async getOne(
    @Headers('x-org') xOrg: string | undefined,
    @Param('id') id: string,
  ) {
    const slug = this.requireOrgSlug(xOrg);
    return this.categories.getOne(slug, id);
  }

  @Post()
  async create(
    @Headers('x-org') xOrg: string | undefined,
    @Body() dto: CreateCategoryDto,
  ) {
    const slug = this.requireOrgSlug(xOrg);
    return this.categories.create(slug, dto);
  }

  @Put(':id')
  async update(
    @Headers('x-org') xOrg: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const slug = this.requireOrgSlug(xOrg);
    return this.categories.update(slug, id, dto);
  }

  @Delete(':id')
  async remove(
    @Headers('x-org') xOrg: string | undefined,
    @Param('id') id: string,
  ) {
    const slug = this.requireOrgSlug(xOrg);
    return this.categories.remove(slug, id);
  }
}