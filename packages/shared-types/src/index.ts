// Shared types for SAI Platform

export interface AIToolInput {
  name: string;
  category: "LLM" | "CodeGen" | "RPA" | "Analytics" | "Other";
  dataTypes: ("PII" | "Financial" | "IP" | "Proprietary" | "Public")[];
  users: number;
  frequency: "Daily" | "Weekly" | "Rarely";
  controls: string[];
  notes?: string;
}

export interface RiskScore {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  factors: {
    dataType: number;
    userCount: number;
    controls: number;
    frequency: number;
  };
  recommendations: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "OWNER";
}

export interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  country: string;
}

export {
  PRICING_CONFIG,
  pricingFeatureFlags,
  calculatePricing,
} from './pricing';
export type {
  PricingTier,
  PricingInput,
  PricingBreakdown,
  PricingQuote,
} from './pricing';
