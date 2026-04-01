type RiskDomain =
  | 'biometric-identification'
  | 'critical-infrastructure'
  | 'education'
  | 'employment'
  | 'essential-services'
  | 'law-enforcement'
  | 'migration-border'
  | 'justice-democracy'
  | 'other';

export interface RiskClassificationInput {
  systemName: string;
  domain: RiskDomain;
  hasBiometricIdentification?: boolean;
  isSafetyComponent?: boolean;
  impactsFundamentalRights?: boolean;
  userScale?: number;
}

export interface RiskClassificationResult {
  systemName: string;
  euAiActTier: 'high-risk' | 'limited-risk' | 'minimal-risk';
  score: number;
  rationale: string[];
  suggestedControls: string[];
}

const ANNEX_III_DOMAINS = new Set<RiskDomain>([
  'biometric-identification',
  'critical-infrastructure',
  'education',
  'employment',
  'essential-services',
  'law-enforcement',
  'migration-border',
  'justice-democracy',
]);

export class RiskClassifierService {
  static classify(input: RiskClassificationInput): RiskClassificationResult {
    let score = 0;
    const rationale: string[] = [];

    if (ANNEX_III_DOMAINS.has(input.domain)) {
      score += 60;
      rationale.push('System domain matches Annex III high-risk categories.');
    }

    if (input.hasBiometricIdentification) {
      score += 20;
      rationale.push('System performs biometric identification-related processing.');
    }

    if (input.isSafetyComponent) {
      score += 15;
      rationale.push('System acts as a safety component in a regulated product context.');
    }

    if (input.impactsFundamentalRights) {
      score += 15;
      rationale.push('Potential impact on fundamental rights has been indicated.');
    }

    if ((input.userScale || 0) >= 100000) {
      score += 10;
      rationale.push('Large population impact based on expected user scale.');
    }

    const cappedScore = Math.min(score, 100);
    const euAiActTier = cappedScore >= 60 ? 'high-risk' : cappedScore >= 30 ? 'limited-risk' : 'minimal-risk';

    const suggestedControls =
      euAiActTier === 'high-risk'
        ? [
            'risk_management_system',
            'data_governance_controls',
            'technical_documentation',
            'human_oversight',
            'post_market_monitoring',
          ]
        : euAiActTier === 'limited-risk'
        ? ['transparency_notice', 'user_disclosure', 'incident_logging']
        : ['baseline_monitoring'];

    if (rationale.length === 0) {
      rationale.push('No Annex III or elevated-risk signals were identified from provided inputs.');
    }

    return {
      systemName: input.systemName,
      euAiActTier,
      score: cappedScore,
      rationale,
      suggestedControls,
    };
  }
}