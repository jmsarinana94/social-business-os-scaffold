// apps/api/src/modules/orders/orders.controller.ts

import {
  BadRequestException,
  Controller,
  Get,
  Headers,
} from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  /**
   * Simple health check for the Orders module
   * Used by e2e: /orders/health
   */
  @Get('health')
  health() {
    return { ok: true, scope: 'orders' };
  }

  /**
   * List orders for the current org.
   *
   * For now we just:
   * - Enforce that X-Org is present (400 if missing)
   * - Return an empty array (e2e only asserts "is array")
   *
   * This keeps behaviour consistent with other modules while
   * staying tiny until we flesh out full Orders CRUD.
   */
  @Get()
  listOrders(@Headers('x-org') orgHeader?: string) {
    if (!orgHeader) {
      throw new BadRequestException('X-Org header is required');
    }

    // TODO: in a future step, wire this to OrdersService + Prisma
    // and filter orders by org.
    return [];
  }
}