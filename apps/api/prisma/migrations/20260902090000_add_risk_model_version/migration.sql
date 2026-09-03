-- Record which scoring model produced each stored risk score, so a score
-- taken last quarter can still be explained after the model changes.
ALTER TABLE "RiskScore" ADD COLUMN "modelVersion" TEXT;
