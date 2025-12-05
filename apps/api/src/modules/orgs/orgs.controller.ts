import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  /**
   * POST /orgs
   * Create a new organization.
   *
   * Body: { slug: string, name: string }
   */
  @Post()
  async create(@Body() body: { slug?: string; name?: string }) {
    const { slug, name } = body || {};
    if (!slug || !name) {
      throw new BadRequestException('Both "slug" and "name" are required');
    }
    return this.orgs.create(slug, name);
  }

  /**
   * GET /orgs/me
   * Returns the organization for the current X-Org or X-Org-Slug header.
   * Declared BEFORE /orgs/:slug to prevent routing conflicts.
   */
  @Get('me')
  async me(@Headers() headers: Record<string, any>) {
    const slug =
      (headers['x-org'] as string) || (headers['x-org-slug'] as string);

    if (!slug) {
      throw new BadRequestException(
        'Missing X-Org or X-Org-Slug header to identify organization',
      );
    }

    return this.orgs.get(slug);
  }

  /**
   * GET /orgs/:slug
   * Retrieve an organization by slug.
   */
  @Get(':slug')
  async get(@Param('slug') slug: string) {
    if (!slug) {
      throw new BadRequestException('Organization slug is required');
    }
    return this.orgs.get(slug);
  }
}