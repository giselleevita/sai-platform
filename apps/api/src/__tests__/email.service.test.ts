describe('resolveEmailDeliveryMode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to console in development when EMAIL_PROVIDER is unset', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_PROVIDER;
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('console');
  });

  it('defaults to none in production when EMAIL_PROVIDER is unset', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.EMAIL_PROVIDER;
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('none');
  });

  it('respects explicit console', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'console';
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('console');
  });

  it('resolves sendgrid to none when SendGrid env is incomplete', async () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'sendgrid';
    delete process.env.SENDGRID_API_KEY;
    const log = await import('../utils/logger');
    jest.spyOn(log.logger, 'warn').mockImplementation(() => {});
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('none');
  });

  it('resolves sendgrid when SendGrid env is complete', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'SG.test';
    process.env.SENDGRID_FROM = 'noreply@example.com';
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('sendgrid');
  });

  it('resolves ses when SES env is complete', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.SES_FROM = 'verified@example.com';
    process.env.AWS_REGION = 'eu-west-1';
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('ses');
  });

  it('resolves smtp when SMTP env is complete', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('smtp');
  });

  it('resolves smtp to none when SMTP env is incomplete', async () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'smtp';
    delete process.env.SMTP_HOST;
    const log = await import('../utils/logger');
    jest.spyOn(log.logger, 'warn').mockImplementation(() => {});
    const { resolveEmailDeliveryMode } = await import('../services/email.service');
    expect(resolveEmailDeliveryMode()).toBe('none');
  });
});
