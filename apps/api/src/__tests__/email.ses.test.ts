import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

describe('EmailService SES delivery', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.SES_FROM = 'verified@example.com';
    process.env.AWS_REGION = 'eu-west-1';
    (SESv2Client as jest.Mock).mockClear();
    (SendEmailCommand as unknown as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends mail via SES when EMAIL_PROVIDER=ses', async () => {
    const { EmailService } = await import('../services/email.service');
    await EmailService.sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(SESv2Client).toHaveBeenCalledWith({ region: 'eu-west-1' });
    const client = (SESv2Client as jest.Mock).mock.results[0].value;
    expect(client.send).toHaveBeenCalled();
    expect(SendEmailCommand as unknown as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        FromEmailAddress: 'verified@example.com',
        Destination: { ToAddresses: ['user@example.com'] },
      }),
    );
  });
});
