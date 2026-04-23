import nodemailer from 'nodemailer';

describe('EmailService SMTP delivery', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_PORT = '587';

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'test-msg-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends mail via nodemailer when EMAIL_PROVIDER=smtp', async () => {
    const { EmailService } = await import('../services/email.service');
    await EmailService.sendEmail({
      to: 'recipient@test.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: 'user@example.com', pass: 'secret' },
      }),
    );

    const transport = (nodemailer.createTransport as jest.Mock).mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@test.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        text: 'Hi',
      }),
    );
  });
});
