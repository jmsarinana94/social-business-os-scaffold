import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { TestOrJwtAuthGuard } from '@/modules/auth/guards/test-or-jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CreateProductDto,
  CreateProductSchema,
  UpdateProductDto,
  UpdateProductSchema,
} from './products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  list(@Headers('x-org') org?: string) {
    return this.svc.list(org);
  }

  @Get(':id')
  get(@Param('id') id: string, @Headers('x-org') org?: string) {
    return this.svc.get(org, id);
  }

  @UseGuards(TestOrJwtAuthGuard)
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateProductSchema)) dto: CreateProductDto,
    @Headers('x-org') org?: string,
  ) {
    return this.svc.create(dto, org);
  }

  @UseGuards(TestOrJwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) dto: UpdateProductDto,
    @Headers('x-org') org?: string,
  ) {
    return this.svc.update(org, id, dto);
  }

  @UseGuards(TestOrJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-org') org?: string) {
    return this.svc.remove(org, id);
  }
}