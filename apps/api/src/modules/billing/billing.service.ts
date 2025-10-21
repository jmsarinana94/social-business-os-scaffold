import { Injectable, Logger } from '@nestjs/common';

type StripeLike = any;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  private get isConfigured() {
    return !!process.env.STRIPE_API_KEY;
  }

  /** Lazy load Stripe to keep build/test green without dependency installed */
  private async stripe(): Promise<StripeLike | null> {
    if (!this.isConfigured) {
      this.logger.warn('Stripe not configured (missing STRIPE_API_KEY)');
      return null;
    }
    // dynamic import – won’t execute unless called
    const Stripe = (await import('stripe')).default;

    // NOTE:
    // Newer stripe typings require a literal union for apiVersion (e.g. "2025-09-30.clover").
    // To avoid compile-time coupling, instantiate without options (uses default from SDK).
    const stripe = new Stripe(process.env.STRIPE_API_KEY as string);
    return stripe as any;
  }

  async ensureCustomerForOrg(params: { orgSlug: string; orgName?: string; email?: string }) {
    const stripe = await this.stripe();
    if (!stripe) {
      // return a harmless stub for local/dev w/o stripe
      return { id: `fake_cus_${params.orgSlug}`, stub: true };
    }

    // You can store stripeCustomerId on Organization later; for now we search by metadata
    const list = await stripe.customers.list({
      limit: 100,
      email: params.email || undefined,
    });

    const existing = list.data.find((c: any) => c?.metadata?.orgSlug === params.orgSlug);
    if (existing) return existing;

    return stripe.customers.create({
      name: params.orgName || params.orgSlug,
      email: params.email,
      metadata: { orgSlug: params.orgSlug },
    });
  }

  async createCheckoutSession(params: {
    orgSlug: string;
    priceId: string;          // Stripe Price ID (recurring)
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
  }) {
    const stripe = await this.stripe();
    if (!stripe) {
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

  /** Webhook verification; bypasses in test/local if secret missing */
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
    if (!stripe) throw new Error('Stripe not configured for webhook');

    return (stripe as any).webhooks.constructEvent(rawBody, sigHeader, whSecret);
  }
}