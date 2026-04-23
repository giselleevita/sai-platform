import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { getAttachmentStorage } from '../services/attachments';

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export class EvidenceAttachmentsController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const evidenceId = req.params.id;
    const rows = await prisma.evidenceAttachment.findMany({
      where: { companyId, evidenceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, filename: true, contentType: true, sizeBytes: true, sha256: true, createdAt: true, createdById: true },
    });
    res.json({ success: true, data: rows });
  }

  static async upload(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id || null;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const evidenceId = req.params.id;
    const file = (req as any).file as { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined;
    if (!file) {
      res.status(400).json({ success: false, error: 'file is required' });
      return;
    }

    const evidence = await prisma.evidence.findFirst({ where: { id: evidenceId, companyId }, select: { id: true } });
    if (!evidence) {
      res.status(404).json({ success: false, error: 'Evidence not found' });
      return;
    }

    const hash = sha256(file.buffer);
    const id = crypto.randomBytes(12).toString('hex');
    const key = `${companyId}/${evidenceId}/${id}`;
    const { storage } = getAttachmentStorage();
    await storage.putObject({ key, contentType: file.mimetype, body: file.buffer });

    const row = await prisma.evidenceAttachment.create({
      data: {
        id,
        companyId,
        evidenceId,
        filename: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        sha256: hash,
        storagePath: key,
        createdById: actorId,
      },
      select: { id: true, filename: true, contentType: true, sizeBytes: true, sha256: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: 'EVIDENCE_ATTACHMENT_UPLOAD',
        targetType: 'Evidence',
        targetId: evidenceId,
        changes: { attachmentId: row.id, filename: row.filename, sha256: row.sha256, key } as any,
      },
    });

    res.status(201).json({ success: true, data: row });
  }

  static async download(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const attachmentId = req.params.attachmentId;
    const row = await prisma.evidenceAttachment.findFirst({
      where: { id: attachmentId, companyId },
      select: { storagePath: true, filename: true, contentType: true },
    });
    if (!row) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    const { driver, storage } = getAttachmentStorage();
    if (driver === 'local') {
      res.setHeader('Content-Type', row.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${row.filename.replace(/"/g, '')}"`);
      const stream = await storage.getObjectStream({ key: row.storagePath });
      stream.on('error', () => {
        res.status(404).json({ success: false, error: 'Not found' });
      });
      stream.pipe(res);
      return;
    }

    const signed = await storage.getSignedDownloadUrl({
      key: row.storagePath,
      filename: row.filename,
      contentType: row.contentType,
      expiresSeconds: 60,
    });
    res.redirect(302, signed.url);
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id || null;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const attachmentId = req.params.attachmentId;
    const row = await prisma.evidenceAttachment.findFirst({
      where: { id: attachmentId, companyId },
      select: { id: true, evidenceId: true, storagePath: true, filename: true, sha256: true },
    });
    if (!row) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    const { storage } = getAttachmentStorage();
    await storage.deleteObject({ key: row.storagePath });
    await prisma.evidenceAttachment.delete({ where: { id: row.id } });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: 'EVIDENCE_ATTACHMENT_DELETE',
        targetType: 'Evidence',
        targetId: row.evidenceId,
        changes: { attachmentId: row.id, filename: row.filename, sha256: row.sha256 } as any,
      },
    });

    res.json({ success: true });
  }
}

