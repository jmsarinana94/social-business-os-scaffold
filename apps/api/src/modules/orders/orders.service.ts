// apps/api/src/modules/orders/orders.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  /**
   * Health check used by e2e + coverage.
   * test/e2e/orders.e2e-spec.ts expects:
   *   { ok: true, scope: 'orders' }
   */
  health() {
    return {
      ok: true,
      scope: 'orders',
    };
  }
}