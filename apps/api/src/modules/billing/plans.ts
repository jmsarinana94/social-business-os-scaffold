export type PlanKey = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceUsdMonthly: number;    // UI/info only; Stripe is source of truth
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDef> = {
  FREE: {
    key: 'FREE',
    name: 'Free',
    priceUsdMonthly: 0,
    features: ['Basic products', '1 org member', 'Community support'],
  },
  STARTER: {
    key: 'STARTER',
    name: 'Starter',
    priceUsdMonthly: 19,
    features: ['Up to 3 members', 'Email support', 'Basic analytics'],
  },
  GROWTH: {
    key: 'GROWTH',
    name: 'Growth',
    priceUsdMonthly: 79,
    features: ['Up to 10 members', 'Priority support', 'Advanced analytics'],
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    priceUsdMonthly: 0, // custom
    features: ['Unlimited members', 'SLA & SSO', 'Custom onboarding'],
  },
};