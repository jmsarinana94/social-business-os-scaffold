import { Controller, Get, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Get('me')
  async me(@Headers('x-org') orgId?: string) {
    if (!orgId) {
      throw new HttpException('X-Org header is required', HttpStatus.BAD_REQUEST);
    }
    const org = await this.orgs.findById(orgId);
    if (!org) throw new HttpException('Org not found', HttpStatus.NOT_FOUND);
    return org;
  }
}