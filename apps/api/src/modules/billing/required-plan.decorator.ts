import { SetMetadata } from '@nestjs/common';
export const REQUIRED_PLAN = 'required_plan';
export const RequiredPlan = (plan: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE') =>
  SetMetadata(REQUIRED_PLAN, plan);