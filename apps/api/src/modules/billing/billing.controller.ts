// apps/api/src/modules/billing/billing.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { CheckoutSessionDto, EnsureCustomerDto } from './billing.dtos';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for billing module' })
  @ApiOkResponse({
    description: 'Billing module is reachable',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        scope: { type: 'string', example: 'billing' },
      },
    },
  })
  health() {
    return { ok: true, scope: 'billing' };
  }

  @Post('customer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ensure a Stripe customer exists for the org' })
  @ApiBody({ type: EnsureCustomerDto })
  @ApiOkResponse({
    description: 'Customer ensured/created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cus_123' },
        raw: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid fields' })
  async ensureCustomer(@Body() body: EnsureCustomerDto) {
    if (!body?.orgSlug) throw new BadRequestException('orgSlug is required');
    const customer = await this.billing.ensureCustomerForOrg(body);
    return { id: (customer as any).id, raw: customer };
  }

  @Post('checkout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a checkout session for subscription' })
  @ApiBody({ type: CheckoutSessionDto })
  @ApiOkResponse({
    description: 'Checkout session created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cs_test_123' },
        url: { type: 'string', nullable: true, example: 'https://checkout.stripe.com/...' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid fields' })
  async checkout(@Body() body: CheckoutSessionDto) {
    const { orgSlug, priceId, successUrl, cancelUrl, customerEmail } = body || ({} as any);
    if (!orgSlug || !priceId || !successUrl || !cancelUrl) {
      throw new BadRequestException('orgSlug, priceId, successUrl, cancelUrl are required');
    }
    const session = await this.billing.createCheckoutSession({
      orgSlug,
      priceId,
      successUrl,
      cancelUrl,
      customerEmail,
    });
    return { id: (session as any).id, url: (session as any).url ?? null };
  }

  @ApiExcludeEndpoint()
  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response) {
    try {
      const raw: Buffer =
        (req as any).rawBody ??
        Buffer.from((req as any).body ? JSON.stringify((req as any).body) : '');

      const event = await this.billing.verifyAndParseWebhook(
        raw,
        req.headers['stripe-signature'] as string | undefined,
      );

      switch (event.type) {
        case 'checkout.session.completed':
          // TODO: mark org as subscribed / record subscription id
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
        case 'customer.subscription.deleted':
          // TODO: sync subscription status
          break;
        default:
          break;
      }
      return res.status(200).json({ received: true });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message ?? 'webhook error' });
    }
  }
}