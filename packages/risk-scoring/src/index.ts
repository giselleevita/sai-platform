import { AIToolInput, RiskScore } from "@sai/shared-types";

/**
 * Scoring model version.
 *
 * Any change to a weight, a threshold or the shape of the result must bump
 * this. An auditor asking why a tool moved from Medium to High needs to be
 * able to tell whether the tool changed or the model did, and a score stored
 * without a model version cannot answer that.
 */
export const RISK_MODEL_VERSION = "1.1.0";

const DATA_TYPE_RISK: Record<string, number> = {
  PII: 30,
  Financial: 25,
  IP: 20,
  Proprietary: 15,
  Public: 5,
};

/** A category we do not recognise is treated as mid-risk rather than ignored. */
const UNKNOWN_DATA_TYPE_RISK = 10;

/**
 * A tool with no recorded data types is not a safe tool, it is an unassessed
 * one. The previous model divided by the number of categories, so an empty
 * list produced NaN, and because every NaN comparison is false the tool fell
 * through to "Low". Unclassified tools disappeared from review by scoring
 * themselves clean.
 */
const UNCLASSIFIED_DATA_RISK = 20;

/**
 * Risk follows the most sensitive category, not the average of all of them.
 * Averaging meant that recording a second, less sensitive data type lowered a
 * tool's score: PII alone scored 50, PII plus Public scored 38. Breadth then
 * adds a small increment, so recording more of what a tool touches can never
 * reduce its risk.
 */
const BREADTH_INCREMENT = 2;
const MAX_BREADTH_BONUS = 6;

/**
 * Controls are self-declared and unverified. They lower risk, but they cannot
 * erase it, and unrecognised strings earn nothing: twelve invented control
 * names previously took a PII tool from 50 to 26.
 */
const RECOGNISED_CONTROLS = [
  "MFA",
  "Encryption",
  "DLP",
  "SSO",
  "Logging",
  "Access Review",
  "DPA",
];
const CONTROL_CREDIT = 2;
const MAX_CONTROL_MITIGATION = 10;

const MAX_USER_RISK = 20;
const USERS_AT_MAX_RISK = 100;

function dataTypeRisk(dataTypes: AIToolInput["dataTypes"]): number {
  const distinct = Array.from(new Set(dataTypes));
  if (distinct.length === 0) {
    return UNCLASSIFIED_DATA_RISK;
  }
  const highest = Math.max(
    ...distinct.map((type) => DATA_TYPE_RISK[type] ?? UNKNOWN_DATA_TYPE_RISK)
  );
  const breadth = Math.min(
    (distinct.length - 1) * BREADTH_INCREMENT,
    MAX_BREADTH_BONUS
  );
  return highest + breadth;
}

function controlMitigation(controls: string[]): number {
  const recognised = Array.from(new Set(controls)).filter((control) =>
    RECOGNISED_CONTROLS.includes(control)
  );
  return -Math.min(recognised.length * CONTROL_CREDIT, MAX_CONTROL_MITIGATION);
}

function frequencyRisk(frequency: AIToolInput["frequency"]): number {
  if (frequency === "Daily") return 10;
  if (frequency === "Weekly") return 5;
  return 2;
}

function userRisk(users: number): number {
  if (!Number.isFinite(users) || users <= 0) return 0;
  return Math.min((users / USERS_AT_MAX_RISK) * MAX_USER_RISK, MAX_USER_RISK);
}

function recommend(tool: AIToolInput): string[] {
  const controls = new Set(tool.controls);
  const recommendations: string[] = [];
  if (tool.dataTypes.length === 0) {
    recommendations.push("Record the data types this tool handles");
  }
  if (!controls.has("MFA")) recommendations.push("Enable MFA");
  if (!controls.has("Encryption")) {
    recommendations.push("Encrypt data in transit and at rest");
  }
  if (tool.dataTypes.includes("PII")) {
    recommendations.push("Ensure DPA with vendor");
  }
  if (tool.users > 100) recommendations.push("Implement DLP solution");
  return recommendations;
}

export function calculateRiskScore(tool: AIToolInput): RiskScore {
  const data = dataTypeRisk(tool.dataTypes);
  const users = userRisk(tool.users);
  const frequency = frequencyRisk(tool.frequency);
  const controls = controlMitigation(tool.controls);

  const total = Math.max(0, Math.min(100, data + users + frequency + controls));

  let level: RiskScore["level"];
  if (total > 75) level = "Critical";
  else if (total > 50) level = "High";
  else if (total > 25) level = "Medium";
  else level = "Low";

  return {
    score: Math.round(total),
    level,
    factors: {
      dataType: Math.round(data),
      userCount: Math.round(users),
      controls: Math.round(controls),
      frequency: Math.round(frequency),
    },
    recommendations: recommend(tool),
    modelVersion: RISK_MODEL_VERSION,
  };
}
