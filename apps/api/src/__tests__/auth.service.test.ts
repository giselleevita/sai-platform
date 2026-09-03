import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { prisma } from '../services/prisma.client';
import { config } from '../config';

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
      create: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userCompanyMembership: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({ token: 'rt', expiresAt: new Date() }),
    },
    $transaction: jest.fn(),
  };
  return { prisma: prismaMock };
});

describe('AuthService password hashing', () => {
  it('hashes a password so the plaintext is not recoverable from the hash', async () => {
    const hash = await AuthService.hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('round-trips: comparePassword accepts the original password against its own hash', async () => {
    const hash = await AuthService.hashPassword('s3cret-Pass');
    await expect(AuthService.comparePassword('s3cret-Pass', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password against an unrelated hash', async () => {
    const hash = await AuthService.hashPassword('s3cret-Pass');
    await expect(AuthService.comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});

describe('AuthService.generateToken', () => {
  it('issues a JWT that decodes back to the same payload and is signed with the configured secret', () => {
    const payload = { id: 'u1', email: 'a@b.com', companyId: 'co-1', role: 'MANAGEMENT' };
    const token = AuthService.generateToken(payload);

    const decoded = jwt.verify(token, config.jwt.secret) as typeof payload;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.companyId).toBe(payload.companyId);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejects verification against the wrong secret', () => {
    const token = AuthService.generateToken({ id: 'u1', email: 'a@b.com', companyId: 'co-1', role: 'MANAGEMENT' });
    expect(() => jwt.verify(token, 'not-the-real-secret')).toThrow();
  });
});

describe('AuthService.signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects signup when a user with that email already exists', async () => {
    jest.mocked((prisma as any).user.findUnique).mockResolvedValue({ id: 'existing-user' });

    await expect(
      AuthService.signup({
        email: 'taken@example.com',
        password: 'x',
        name: 'A',
        companyName: 'Acme',
      }),
    ).rejects.toThrow('already exists');

    expect((prisma as any).company.findUnique).not.toHaveBeenCalled();
  });

  it('rejects signup when a company with that email already exists', async () => {
    jest.mocked((prisma as any).user.findUnique).mockResolvedValue(null);
    jest.mocked((prisma as any).company.findUnique).mockResolvedValue({ id: 'existing-company' });

    await expect(
      AuthService.signup({
        email: 'new@example.com',
        password: 'x',
        name: 'A',
        companyName: 'Acme',
      }),
    ).rejects.toThrow('already exists');
  });
});
