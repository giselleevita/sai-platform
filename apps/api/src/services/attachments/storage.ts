export type PutObjectParams = {
  key: string;
  contentType: string;
  body: Buffer;
};

export type SignedDownloadUrlParams = {
  key: string;
  filename: string;
  contentType: string;
  expiresSeconds: number;
};

export type GetObjectStreamParams = {
  key: string;
};

export type DeleteObjectParams = {
  key: string;
};

export interface AttachmentStorage {
  putObject(params: PutObjectParams): Promise<void>;
  getSignedDownloadUrl(params: SignedDownloadUrlParams): Promise<{ url: string; expiresAt: Date }>;
  getObjectStream(params: GetObjectStreamParams): Promise<NodeJS.ReadableStream>;
  deleteObject(params: DeleteObjectParams): Promise<void>;
}

