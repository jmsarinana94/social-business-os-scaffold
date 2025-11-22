import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { OrgSlug } from '../../shared/decorators/org-slug.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(
    @OrgSlug() orgSlug: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(orgSlug, dto);
  }

  @Get()
  findAll(
    @OrgSlug() orgSlug: string,
    @Query('search') search?: string,
  ) {
    // e2e expects an array response
    return this.contactsService.findAll(orgSlug, search);
  }

  @Get(':id')
  findOne(
    @OrgSlug() orgSlug: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.findOne(orgSlug, id);
  }

  @Patch(':id')
  update(
    @OrgSlug() orgSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(orgSlug, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @OrgSlug() orgSlug: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.contactsService.remove(orgSlug, id);
    // No body -> 204 No Content (matches e2e expectation)
  }
}