import { AIToolInput, RiskScore } from "@sai/shared-types";

export function calculateRiskScore(tool: AIToolInput): RiskScore {
  // Data Type Risk: PII = 30, Financial = 25, IP = 20, Proprietary = 15, Public = 5
  const dataTypeRisk = tool.dataTypes.reduce((sum, type) => {
    const risks: Record<string, number> = {
      PII: 30,
      Financial: 25,
      IP: 20,
      Proprietary: 15,
      Public: 5,
    };
    return sum + (risks[type] || 10);
  }, 0) / tool.dataTypes.length;

  // User Count Risk: more users = higher risk
  const userRisk = Math.min((tool.users / 100) * 20, 20);

  // Frequency Risk: Daily = 10, Weekly = 5, Rarely = 2
  const frequencyRisk =
    tool.frequency === "Daily" ? 10 : tool.frequency === "Weekly" ? 5 : 2;

  // Control Mitigation: -2 points per control
  const controlMitigation = -tool.controls.length * 2;

  // Total risk (normalized to 0–100)
  let totalRisk = dataTypeRisk + userRisk + frequencyRisk + controlMitigation;
  totalRisk = Math.max(0, Math.min(100, totalRisk));

  // Determine risk level
  let level: "Low" | "Medium" | "High" | "Critical";
  if (totalRisk > 75) level = "Critical";
  else if (totalRisk > 50) level = "High";
  else if (totalRisk > 25) level = "Medium";
  else level = "Low";

  // Generate recommendations
  const recommendations: string[] = [];
  if (!tool.controls.includes("MFA")) recommendations.push("Enable MFA");
  if (!tool.controls.includes("Encryption"))
    recommendations.push("Encrypt data in transit and at rest");
  if (tool.dataTypes.includes("PII"))
    recommendations.push("Ensure DPA with vendor");
  if (tool.users > 100) recommendations.push("Implement DLP solution");

  return {
    score: Math.round(totalRisk),
    level,
    factors: {
      dataType: Math.round(dataTypeRisk),
      userCount: Math.round(userRisk),
      controls: Math.round(controlMitigation),
      frequency: Math.round(frequencyRisk),
    },
    recommendations,
  };
}
