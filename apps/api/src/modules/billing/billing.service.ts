// apps/api/src/modules/billing/billing.service.ts

import { Injectable, Logger } from '@nestjs/common';

type StripeLike = any;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  private get isConfigured(): boolean {
    return !!process.env.STRIPE_API_KEY;
  }

  /**
   * Lazy-load Stripe so tests and local dev can run
   * without stripe being installed or configured.
   */
  private async stripe(): Promise<StripeLike | null> {
    if (!this.isConfigured) {
      this.logger.warn('Stripe not configured (missing STRIPE_API_KEY)');
      return null;
    }

    // dynamic import – won’t execute unless called
    const Stripe = (await import('stripe')).default;

    // NOTE:
    // Newer Stripe typings want a literal union apiVersion.
    // To avoid compile-time coupling, we instantiate without options
    // so Stripe uses its own default apiVersion.
    const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

    return stripe as any;
  }

  async ensureCustomerForOrg(params: {
    orgSlug: string;
    orgName?: string;
    email?: string;
  }) {
    const stripe = await this.stripe();
    if (!stripe) {
      // return a harmless stub for local/dev w/o Stripe
      return {
        id: `fake_cus_${params.orgSlug}`,
        stub: true,
      };
    }

    // Later you can store stripeCustomerId on Organization.
    // For now we search by metadata + optional email.
    const list = await stripe.customers.list({
      limit: 100,
      email: params.email || undefined,
    });

    const existing = list.data.find(
      (c: any) => c?.metadata?.orgSlug === params.orgSlug,
    );
    if (existing) return existing;

    return stripe.customers.create({
      name: params.orgName || params.orgSlug,
      email: params.email,
      metadata: { orgSlug: params.orgSlug },
    });
  }

  async createCheckoutSession(params: {
    orgSlug: string;
    priceId: string; // Stripe Price ID (recurring)
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
  }) {
    const stripe = await this.stripe();
    if (!stripe) {
      // stub so tests/local still "work"
      return {
        id: `fake_cs_${Date.now()}`,
        url: params.successUrl,
        stub: true,
      };
    }

    const customer = await this.ensureCustomerForOrg({
      orgSlug: params.orgSlug,
      orgName: params.orgSlug,
      email: params.customerEmail,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: (customer as any).id,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { orgSlug: params.orgSlug },
    });

    return session;
  }

  /**
   * Webhook verification.
   * In test/local without STRIPE_WEBHOOK_SECRET,
   * falls back to simple JSON parse.
   */
  async verifyAndParseWebhook(rawBody: Buffer, sigHeader?: string) {
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // In tests or local without secret → return JSON parse
    if (process.env.NODE_ENV === 'test' || !whSecret) {
      try {
        return JSON.parse(rawBody.toString('utf-8'));
      } catch {
        return { type: 'unknown', data: {} };
      }
    }

    const stripe = await this.stripe();
    if (!stripe) {
      throw new Error('Stripe not configured for webhook');
    }

    return (stripe as any).webhooks.constructEvent(
      rawBody,
      sigHeader,
      whSecret,
    );
  }
}