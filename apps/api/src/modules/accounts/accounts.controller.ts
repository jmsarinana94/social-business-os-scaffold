// apps/api/src/modules/accounts/accounts.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrgGuard } from '../orgs/org.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@UseGuards(OrgGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  private assertOrg(org?: string) {
    if (!org) {
      throw new BadRequestException('X-Org header required');
    }
  }

  @Get()
  async list(@Headers('x-org') org?: string) {
    this.assertOrg(org);
    return this.accounts.list(org!);
  }

  @Get(':id')
  async get(@Headers('x-org') org: string | undefined, @Param('id') id: string) {
    this.assertOrg(org);
    return this.accounts.get(org!, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers('x-org') org: string | undefined,
    @Body() dto: CreateAccountDto,
  ) {
    this.assertOrg(org);
    // TODO: wire real userId from auth; null for now.
    return this.accounts.create(org!, null, dto);
  }

  @Patch(':id')
  async update(
    @Headers('x-org') org: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    this.assertOrg(org);
    return this.accounts.update(org!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Headers('x-org') org: string | undefined,
    @Param('id') id: string,
  ): Promise<void> {
    this.assertOrg(org);
    await this.accounts.remove(org!, id);
  }
}