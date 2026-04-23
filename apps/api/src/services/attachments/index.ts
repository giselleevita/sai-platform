import { AttachmentStorage } from './storage';
import { LocalAttachmentStorage } from './local.storage';
import { S3AttachmentStorage } from './s3.storage';

export type AttachmentsDriver = 'local' | 's3';

let cached: { driver: AttachmentsDriver; storage: AttachmentStorage } | null = null;

export function getAttachmentsDriver(): AttachmentsDriver {
  const raw = (process.env.ATTACHMENTS_DRIVER || 'local').toLowerCase();
  return raw === 's3' ? 's3' : 'local';
}

export function getAttachmentStorage(): { driver: AttachmentsDriver; storage: AttachmentStorage } {
  const driver = getAttachmentsDriver();
  if (cached?.driver === driver) return cached;

  const storage: AttachmentStorage = driver === 's3' ? new S3AttachmentStorage() : new LocalAttachmentStorage();
  cached = { driver, storage };
  return cached;
}

