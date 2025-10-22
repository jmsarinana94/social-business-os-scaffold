import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Post()
  async create(@Body() body: any) {
    const { slug, name } = body || {};
    return this.orgs.create(slug, name);
  }

  // IMPORTANT: declare 'me' BEFORE ':slug' to avoid /orgs/me being captured by ':slug'
  @Get('me')
  async me(@Headers() headers: Record<string, any>) {
    const slug = (headers['x-org'] || headers['x-org-slug']) as string;
    return this.orgs.get(slug);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.orgs.get(slug);
  }
}