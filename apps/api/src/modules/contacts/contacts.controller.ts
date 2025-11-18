// apps/api/src/modules/contacts/contacts.controller.ts

import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { OrgGuard } from '../orgs/org.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@UseGuards(OrgGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  private assertOrg(org?: string) {
    if (!org) {
      throw new BadRequestException('X-Org header required');
    }
  }

  @Get()
  async list(@Headers('x-org') org: string) {
    this.assertOrg(org);
    return this.contacts.list(org);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Headers('x-org') org: string,
    @Body() dto: CreateContactDto,
  ) {
    this.assertOrg(org);
    return this.contacts.create(org, dto);
  }

  @Patch(':id')
  async update(
    @Headers('x-org') org: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    this.assertOrg(org);
    return this.contacts.update(org, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Headers('x-org') org: string,
    @Param('id') id: string,
  ): Promise<void> {
    this.assertOrg(org);
    await this.contacts.delete(org, id);
  }
}