import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Header,
    HttpCode,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService, CreateAccountDto } from './accounts.service';

function requireOrgHeader(req: any): string {
  const slug = (req.headers['x-org'] || req.headers['X-Org']) as string | undefined;
  if (!slug) throw new BadRequestException('Missing X-Org header');
  return slug;
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  async list(@Req() req: any) {
    const org = requireOrgHeader(req);
    return this.accounts.list(org);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/json')
  @HttpCode(201)
  async create(@Req() req: any, @Body() dto: CreateAccountDto) {
    const org = requireOrgHeader(req);
    const userId = req.user?.sub ?? null;
    return this.accounts.create(org, userId, dto);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const org = requireOrgHeader(req);
    return this.accounts.get(org, id);
  }
}