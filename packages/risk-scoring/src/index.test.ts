import { AIToolInput } from "@sai/shared-types";
import { calculateRiskScore, MAX_POSSIBLE_SCORE, RISK_MODEL_VERSION } from "./index";

const tool = (overrides: Partial<AIToolInput> = {}): AIToolInput => ({
  name: "Test tool",
  category: "LLM",
  dataTypes: ["PII"],
  users: 50,
  frequency: "Daily",
  controls: [],
  ...overrides,
});

describe("calculateRiskScore", () => {
  it("scores on the most sensitive data type, not the average", () => {
    const pii = calculateRiskScore(tool({ dataTypes: ["PII"] }));
    const piiAndPublic = calculateRiskScore(tool({ dataTypes: ["PII", "Public"] }));

    expect(piiAndPublic.score).toBeGreaterThanOrEqual(pii.score);
  });

  it("never lowers a score when another data type is recorded", () => {
    const categories: AIToolInput["dataTypes"] = ["PII", "Financial", "IP", "Proprietary", "Public"];
    let previous = calculateRiskScore(tool({ dataTypes: [categories[0]] })).score;

    for (let i = 2; i <= categories.length; i += 1) {
      const current = calculateRiskScore(tool({ dataTypes: categories.slice(0, i) })).score;
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it("does not treat an unclassified tool as low risk", () => {
    const result = calculateRiskScore(tool({ dataTypes: [] }));

    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.level).not.toBe("Low");
    expect(result.recommendations).toContain("Record the data types this tool handles");
  });

  it("caps how far self-declared controls can reduce risk", () => {
    const uncontrolled = calculateRiskScore(tool({ controls: [] }));
    const heavilyControlled = calculateRiskScore(
      tool({ controls: ["MFA", "Encryption", "DLP", "SSO", "Logging", "Access Review", "DPA"] })
    );

    expect(uncontrolled.score - heavilyControlled.score).toBeLessThanOrEqual(10);
  });

  it("gives no credit for control names it does not recognise", () => {
    const invented = calculateRiskScore(tool({ controls: ["Vibes", "Trust", "Handshake"] }));
    const none = calculateRiskScore(tool({ controls: [] }));

    expect(invented.score).toBe(none.score);
  });

  it("counts a repeated control once", () => {
    const repeated = calculateRiskScore(tool({ controls: ["MFA", "MFA", "MFA"] }));
    const single = calculateRiskScore(tool({ controls: ["MFA"] }));

    expect(repeated.score).toBe(single.score);
  });

  it("keeps the score inside 0 to 100 for extreme input", () => {
    const huge = calculateRiskScore(tool({ users: 1_000_000, dataTypes: ["PII", "Financial"] }));
    const negative = calculateRiskScore(tool({ users: -5, dataTypes: ["Public"], controls: ["MFA", "Encryption"] }));

    expect(huge.score).toBeLessThanOrEqual(100);
    expect(negative.score).toBeGreaterThanOrEqual(0);
  });

  it("rises with user count and with frequency", () => {
    const few = calculateRiskScore(tool({ users: 5 }));
    const many = calculateRiskScore(tool({ users: 500 }));
    const rarely = calculateRiskScore(tool({ frequency: "Rarely" }));
    const daily = calculateRiskScore(tool({ frequency: "Daily" }));

    expect(many.score).toBeGreaterThan(few.score);
    expect(daily.score).toBeGreaterThan(rarely.score);
  });

  it("can reach every level the type allows", () => {
    const worst = calculateRiskScore(
      tool({ dataTypes: ["PII", "Financial", "IP", "Proprietary"], users: 500, frequency: "Daily", controls: [] })
    );
    const best = calculateRiskScore(
      tool({ dataTypes: ["Public"], users: 1, frequency: "Rarely", controls: ["MFA", "Encryption"] })
    );

    expect(worst.level).toBe("Critical");
    expect(best.level).toBe("Low");
  });

  it("keeps the top threshold inside the achievable range", () => {
    expect(MAX_POSSIBLE_SCORE).toBeGreaterThan(55);
  });

  it("stamps every score with the model version", () => {
    expect(calculateRiskScore(tool()).modelVersion).toBe(RISK_MODEL_VERSION);
  });

  it("reports the factors that produced the score", () => {
    const result = calculateRiskScore(tool({ dataTypes: ["PII"], users: 50, frequency: "Daily", controls: ["MFA"] }));

    expect(result.factors.dataType).toBe(30);
    expect(result.factors.userCount).toBe(10);
    expect(result.factors.frequency).toBe(10);
    expect(result.factors.controls).toBe(-2);
    expect(result.score).toBe(48);
  });
});
