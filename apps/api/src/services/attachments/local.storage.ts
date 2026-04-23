import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { AttachmentStorage } from './storage';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function toLocalPath(key: string) {
  // Key is expected to be safe (companyId/evidenceId/attachmentId).
  return path.join(UPLOADS_DIR, key);
}

export class LocalAttachmentStorage implements AttachmentStorage {
  async putObject(params: { key: string; contentType: string; body: Buffer }): Promise<void> {
    const fullPath = toLocalPath(params.key);
    await ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, params.body);
  }

  async getSignedDownloadUrl(params: {
    key: string;
    filename: string;
    contentType: string;
    expiresSeconds: number;
  }): Promise<{ url: string; expiresAt: Date }> {
    // Local driver: the API should serve the file directly (no signed URL).
    // This method exists for interface symmetry; callers should branch on driver.
    throw new Error('Signed URLs are not supported for local attachment storage');
  }

  async getObjectStream(params: { key: string }): Promise<NodeJS.ReadableStream> {
    return createReadStream(toLocalPath(params.key));
  }

  async deleteObject(params: { key: string }): Promise<void> {
    const fullPath = toLocalPath(params.key);
    await fs.rm(fullPath, { force: true });
  }
}

