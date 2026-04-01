export interface ConformityAssessmentInput {
  systemName: string;
  euAiActTier: 'high-risk' | 'limited-risk' | 'minimal-risk';
  hasRiskManagement: boolean;
  hasTechnicalDocumentation: boolean;
  hasHumanOversight: boolean;
  hasMonitoringPlan: boolean;
}

export interface ConformityAssessmentResult {
  systemName: string;
  status: 'conformant' | 'partially-conformant' | 'non-conformant';
  score: number;
  gaps: string[];
  nextActions: string[];
}

export class ConformityService {
  static assess(input: ConformityAssessmentInput): ConformityAssessmentResult {
    const requiredControls =
      input.euAiActTier === 'high-risk'
        ? [
            ['risk_management_system', input.hasRiskManagement],
            ['technical_documentation', input.hasTechnicalDocumentation],
            ['human_oversight', input.hasHumanOversight],
            ['post_market_monitoring', input.hasMonitoringPlan],
          ]
        : input.euAiActTier === 'limited-risk'
        ? [
            ['human_oversight', input.hasHumanOversight],
            ['post_market_monitoring', input.hasMonitoringPlan],
          ]
        : [];

    const gaps = requiredControls.filter(([, ok]) => !ok).map(([name]) => String(name));
    const total = requiredControls.length;
    const passed = total - gaps.length;
    const score = total === 0 ? 100 : Math.round((passed / total) * 100);

    const status = score === 100 ? 'conformant' : score >= 50 ? 'partially-conformant' : 'non-conformant';
    const nextActions =
      gaps.length === 0
        ? ['Maintain evidence freshness and periodic reassessment cadence.']
        : gaps.map((gap) => `Implement and evidence control: ${gap}`);

    return {
      systemName: input.systemName,
      status,
      score,
      gaps,
      nextActions,
    };
  }
}