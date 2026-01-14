export type PricingTier = 'mid-market' | 'enterprise';

export interface PricingInput {
  tier: PricingTier;
  aiTools: number;
  frameworks: string[];
  advancedGovernance: boolean;
}

export interface PricingBreakdown {
  baseSubscription: number;
  toolScaling: number | 'custom';
  frameworks: number;
  advancedGovernance: number;
}

export interface PricingQuote {
  breakdown: PricingBreakdown;
  total: number | 'custom';
  notes?: string[];
}

export const PRICING_CONFIG = {
  principles: {
    annualSubscription: true,
    perUserPricing: false,
    scalesByRiskSurface: true,
    auditorsFree: true,
    readOnlyFree: true,
  },
  baseSubscription: {
    'mid-market': 12000,
    enterprise: 25000,
  } as Record<PricingTier, number>,
  toolScaling: [
    { min: 0, max: 25, cost: 0 },
    { min: 26, max: 100, cost: 4000 },
    { min: 101, max: Infinity, cost: 'custom' as const },
  ],
  frameworkAddon: 3000,
  advancedGovernance: 4000,
} as const;

export const pricingFeatureFlags = {
  enforceBaseSubscription: true,
  includeAdvancedGovernanceAddon: true,
  frameworksBillable: true,
  auditorsAreFree: true,
  readOnlyAreFree: true,
  perUserPricing: false,
} as const;

export function calculatePricing(input: PricingInput): PricingQuote {
  const baseSubscription = PRICING_CONFIG.baseSubscription[input.tier];

  const toolTier = PRICING_CONFIG.toolScaling.find(
    (t) => input.aiTools >= t.min && input.aiTools <= t.max
  );
  const toolScaling = toolTier ? toolTier.cost : 'custom';

  const frameworks = (input.frameworks || []).length * PRICING_CONFIG.frameworkAddon;
  const advancedGovernance = input.advancedGovernance ? PRICING_CONFIG.advancedGovernance : 0;

  if (toolScaling === 'custom') {
    return {
      breakdown: {
        baseSubscription,
        toolScaling,
        frameworks,
        advancedGovernance,
      },
      total: 'custom',
      notes: ['Over 100 AI tools requires a custom quote.'],
    };
  }

  const total = baseSubscription + toolScaling + frameworks + advancedGovernance;

  return {
    breakdown: {
      baseSubscription,
      toolScaling,
      frameworks,
      advancedGovernance,
    },
    total,
    notes: [
      'Auditors and read-only users are always free.',
      'Pricing is tied to AI risk surface, not per-user seats.',
    ],
  };
}

export const pricingConfig = PRICING_CONFIG;
export const pricingFlags = pricingFeatureFlags;

export function computePricing(input: PricingInput): PricingQuote {
  return calculatePricing(input);
}
