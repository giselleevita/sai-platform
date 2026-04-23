import { AuthService } from '../services/auth.service';
import { prisma } from '../services/prisma.client';

jest.mock('otplib', () => ({
  __esModule: true,
  TOTP: jest.fn(),
  generateSecret: jest.fn(() => 'secret'),
  generateURI: jest.fn(() => 'otpauth://'),
  verify: jest.fn(async () => true),
}));

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({ token: 'rt', expiresAt: new Date() }),
    },
  };
  return { prisma: prismaMock };
});

describe('AuthService disabled users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects password login when user is disabled', async () => {
    jest.mocked((prisma as any).user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      password: '$hash',
      disabledAt: new Date(),
      mfaEnabled: false,
      company: { id: 'co-1', name: 'Co', email: 'co@x.com' },
    });

    await expect(
      AuthService.login({ email: 'a@b.com', password: 'x' } as any),
    ).rejects.toThrow('disabled');
  });
});

