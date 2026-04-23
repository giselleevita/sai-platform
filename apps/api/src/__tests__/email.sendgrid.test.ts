import sgMail from '@sendgrid/mail';

describe('EmailService SendGrid delivery', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    process.env.SENDGRID_FROM = 'from@example.com';
    (sgMail.send as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends mail via SendGrid when EMAIL_PROVIDER=sendgrid', async () => {
    const { EmailService } = await import('../services/email.service');
    await EmailService.sendEmail({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>H</p>',
      text: 'H',
    });

    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test-key');
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['to@example.com'],
        from: 'from@example.com',
        subject: 'Subj',
      }),
    );
  });
});
