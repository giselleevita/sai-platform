-- The audit trail is always read for one company, newest first. Neither of
-- the existing single-column indexes can serve that ordering, so the page
-- query sorted the whole tenant's history on every request.
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");
