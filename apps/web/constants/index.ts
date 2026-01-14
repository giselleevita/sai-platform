export const CATEGORIES = [
  'LLM',
  'CodeGen',
  'RPA',
  'Analytics',
  'ImageGen',
  'VoiceGen',
  'Other',
] as const;

export const DATA_TYPES = ['PII', 'Financial', 'IP', 'Proprietary', 'Public'] as const;

export const FREQUENCIES = ['Daily', 'Weekly', 'Rarely'] as const;

export const CONTROLS = [
  'MFA',
  'Encryption',
  'DLP',
  'AuditLog',
  'DataResidency',
  'ContractReview',
] as const;

export const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

export type Category = typeof CATEGORIES[number];
export type DataType = typeof DATA_TYPES[number];
export type Frequency = typeof FREQUENCIES[number];
export type Control = typeof CONTROLS[number];
export type RiskLevel = typeof RISK_LEVELS[number];
