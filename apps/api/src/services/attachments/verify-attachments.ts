import crypto from 'crypto';
import { prisma } from '../prisma.client';
import { getAttachmentStorage } from '.';

function sha256Stream(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function verifyRecentAttachments(params: { lookbackHours: number; limit: number }) {
  const since = new Date(Date.now() - params.lookbackHours * 60 * 60 * 1000);
  const rows = await prisma.evidenceAttachment.findMany({
    where: {
      createdAt: { gte: since },
      invalidAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit,
    select: { id: true, companyId: true, evidenceId: true, storagePath: true, sha256: true },
  });

  const { storage } = getAttachmentStorage();

  let verified = 0;
  let failed = 0;
  for (const a of rows) {
    try {
      const stream = await storage.getObjectStream({ key: a.storagePath });
      const actual = await sha256Stream(stream);
      if (actual !== a.sha256) {
        failed += 1;
        await prisma.evidenceAttachment.update({
          where: { id: a.id },
          data: { invalidAt: new Date(), lastVerifiedAt: new Date(), lastVerifyError: 'sha256_mismatch' },
        });
        await prisma.auditLog.create({
          data: {
            companyId: a.companyId,
            actorId: null,
            action: 'EVIDENCE_ATTACHMENT_INTEGRITY_FAIL',
            targetType: 'Evidence',
            targetId: a.evidenceId,
            changes: { attachmentId: a.id, expected: a.sha256, actual } as any,
          },
        });
        continue;
      }

      verified += 1;
      await prisma.evidenceAttachment.update({
        where: { id: a.id },
        data: { lastVerifiedAt: new Date(), lastVerifyError: null },
      });
    } catch (e: any) {
      failed += 1;
      await prisma.evidenceAttachment.update({
        where: { id: a.id },
        data: { lastVerifiedAt: new Date(), lastVerifyError: e?.message || 'verify_failed' },
      });
    }
  }

  return { scanned: rows.length, verified, failed };
}

