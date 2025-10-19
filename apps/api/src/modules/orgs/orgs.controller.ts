import { Body, Controller, Get, HttpCode, NotFoundException, Post, Req } from '@nestjs/common';
import { CreateOrgDto } from './dto/create-org.dto';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateOrgDto) {
    return this.orgs.create(dto);
  }

  @Get('me')
  async me(@Req() req: any) {
    const slug =
      (req?.org?.slug as string | undefined) ||
      (req?.headers?.['x-org'] as string | undefined);

    if (!slug) throw new NotFoundException('Organization not specified');

    const org = await this.orgs.findBySlug(slug);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}