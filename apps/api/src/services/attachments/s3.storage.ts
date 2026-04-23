import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { AttachmentStorage } from './storage';

type S3Config = {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
};

function required(name: string, value?: string): string {
  const v = value?.trim();
  if (!v) throw new Error(`${name} is required for S3 attachment storage`);
  return v;
}

function s3ConfigFromEnv(): S3Config {
  return {
    bucket: required('S3_BUCKET', process.env.S3_BUCKET),
    region: required('S3_REGION', process.env.S3_REGION),
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' ? true : undefined,
  };
}

export class S3AttachmentStorage implements AttachmentStorage {
  private client: S3Client;
  private bucket: string;

  constructor(cfg?: Partial<S3Config>) {
    const env = s3ConfigFromEnv();
    const merged = { ...env, ...cfg };
    this.bucket = merged.bucket;
    this.client = new S3Client({
      region: merged.region,
      endpoint: merged.endpoint,
      forcePathStyle: merged.forcePathStyle,
    });
  }

  async putObject(params: { key: string; contentType: string; body: Buffer }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
  }

  async getSignedDownloadUrl(params: {
    key: string;
    filename: string;
    contentType: string;
    expiresSeconds: number;
  }): Promise<{ url: string; expiresAt: Date }> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ResponseContentType: params.contentType,
      ResponseContentDisposition: `attachment; filename="${params.filename.replace(/"/g, '')}"`,
    });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: params.expiresSeconds });
    return { url, expiresAt: new Date(Date.now() + params.expiresSeconds * 1000) };
  }

  async getObjectStream(params: { key: string }): Promise<NodeJS.ReadableStream> {
    const out = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
      }),
    );
    const body = out.Body;
    if (!body) throw new Error('S3 GetObject returned empty body');
    // Body can be a Readable stream in Node.
    if (body instanceof Readable) return body;
    // Fallback for SDK typing variants.
    return body as unknown as NodeJS.ReadableStream;
  }

  async deleteObject(params: { key: string }): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
      }),
    );
  }
}

