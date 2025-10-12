import { BadRequestException, Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CreateOrgDto } from './dto/create-org.dto';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  // POST /orgs  -> create an organization
  @Post()
  async create(@Body() dto: CreateOrgDto) {
    // simple guard to keep the error message friendly if someone forgets a field
    if (!dto?.slug || !dto?.name) {
      throw new BadRequestException('Both "slug" and "name" are required');
    }
    return this.orgs.create({ slug: dto.slug, name: dto.name });
  }

  // GET /orgs/me  -> return the org for the provided X-Org header
  @Get('me')
  async me(@Headers('x-org') slug?: string) {
    if (!slug) throw new BadRequestException('Missing X-Org header');
    return this.orgs.getCurrentOrg(slug);
  }

  // GET /orgs/:slug  -> fetch an org by slug
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.orgs.findBySlug(slug);
  }
}