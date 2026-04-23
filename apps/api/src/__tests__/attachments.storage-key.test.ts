import { getAttachmentsDriver } from '../services/attachments';

describe('attachments storage driver', () => {
  it('defaults to local', () => {
    const prev = process.env.ATTACHMENTS_DRIVER;
    delete process.env.ATTACHMENTS_DRIVER;
    expect(getAttachmentsDriver()).toBe('local');
    process.env.ATTACHMENTS_DRIVER = prev;
  });
});

