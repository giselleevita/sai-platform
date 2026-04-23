import type { Request, Response } from 'express';
import * as client from 'openid-client';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { isOidcConfigured } from './oidc.config';

const OIDC_COOKIE = {
  PKCE: 'oidc_pkce_verifier',
  STATE: 'oidc_state',
  NONCE: 'oidc_nonce',
} as const;

const COOKIE_OPTS = (maxAgeMs: number) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
};

type CachedConfigKey = string;
const cachedDiscovery = new Map<CachedConfigKey, client.Configuration>();

function b64url(input: Buffer | string) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signOidcState(payload: { state: string; companyId?: string }) {
  const secret = config.jwt.secret;
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

function verifyOidcState(signed: string): { state: string; companyId?: string } | null {
  const [body, sig] = signed.split('.');
  if (!body || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', config.jwt.secret).update(body).digest());
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  try {
    const normalized = body.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    if (!parsed?.state || typeof parsed.state !== 'string') return null;
    if (parsed.companyId && typeof parsed.companyId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function envLookup(secretRef: string): string | null {
  const key = secretRef.trim();
  if (!key) return null;
  const v = process.env[key];
  return v?.trim() ? v.trim() : null;
}

async function getOidcConfiguration(params: {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<client.Configuration> {
  const key = `${params.issuer}::${params.clientId}::${params.redirectUri}`;
  const cached = cachedDiscovery.get(key);
  if (cached) return cached;

  const configuration = await client.discovery(
    new URL(params.issuer),
    params.clientId,
    { redirect_uris: [params.redirectUri] },
    client.ClientSecretPost(params.clientSecret),
  );
  cachedDiscovery.set(key, configuration);
  return configuration;
}

function clearOidcCookies(res: Response) {
  res.clearCookie(OIDC_COOKIE.PKCE, { path: '/' });
  res.clearCookie(OIDC_COOKIE.STATE, { path: '/' });
  res.clearCookie(OIDC_COOKIE.NONCE, { path: '/' });
}

export class OidcService {
  static isEnabled(): boolean {
    return isOidcConfigured();
  }

  /**
   * Redirect browser to the IdP authorization endpoint (PKCE + state + nonce).
   */
  static async startLogin(res: Response, opts?: { companyId?: string }): Promise<void> {
    if (!isOidcConfigured()) {
      throw new Error('OIDC is not configured');
    }
    const companyId = opts?.companyId;
    const maxAge = 10 * 60 * 1000;

    let issuer = config.oidc.issuer as string;
    let clientId = config.oidc.clientId as string;
    let clientSecret = config.oidc.clientSecret as string;
    let redirectUri = config.oidc.redirectUri as string;

    if (companyId) {
      const row = await (await import('./prisma.client')).prisma.ssoConnection.findUnique({
        where: { companyId },
        select: { issuer: true, clientId: true, clientSecretRef: true, redirectUri: true },
      });
      if (row) {
        const secret = envLookup(row.clientSecretRef);
        if (!secret) {
          throw new Error('SSO connection secretRef not configured in environment');
        }
        issuer = row.issuer;
        clientId = row.clientId;
        clientSecret = secret;
        redirectUri = row.redirectUri;
      }
    }

    const configuration = await getOidcConfiguration({ issuer, clientId, clientSecret, redirectUri });
    if (!config.oidc.redirectUri) {
      throw new Error('OIDC_REDIRECT_URI is required');
    }

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    const redirectTo = client.buildAuthorizationUrl(configuration, {
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    res.cookie(OIDC_COOKIE.PKCE, codeVerifier, COOKIE_OPTS(maxAge));
    res.cookie(OIDC_COOKIE.STATE, signOidcState({ state, companyId }), COOKIE_OPTS(maxAge));
    res.cookie(OIDC_COOKIE.NONCE, nonce, COOKIE_OPTS(maxAge));

    res.redirect(redirectTo.toString());
  }

  /**
   * Handle OAuth callback: exchange code, validate ID token, return claims.
   */
  static async handleCallback(req: Request, res: Response): Promise<{
    issuerUrl: string;
    subject: string;
    email: string;
    name: string;
    groups?: string[];
    companyId?: string;
  }> {
    const signedState = req.cookies?.[OIDC_COOKIE.STATE] as string | undefined;
    const parsed = signedState ? verifyOidcState(signedState) : null;
    const companyId = parsed?.companyId;

    let issuer = config.oidc.issuer as string | undefined;
    let clientId = config.oidc.clientId as string | undefined;
    let clientSecret = config.oidc.clientSecret as string | undefined;
    let redirectUri = config.oidc.redirectUri as string | undefined;

    if (companyId) {
      const row = await (await import('./prisma.client')).prisma.ssoConnection.findUnique({
        where: { companyId },
        select: { issuer: true, clientId: true, clientSecretRef: true, redirectUri: true },
      });
      if (row) {
        const secret = envLookup(row.clientSecretRef);
        if (!secret) {
          throw new Error('SSO connection secretRef not configured in environment');
        }
        issuer = row.issuer;
        clientId = row.clientId;
        clientSecret = secret;
        redirectUri = row.redirectUri;
      }
    }

    if (!issuer || !clientId || !clientSecret || !redirectUri) {
      throw new Error('OIDC is not configured');
    }

    const configuration = await getOidcConfiguration({ issuer, clientId, clientSecret, redirectUri });

    const codeVerifier = req.cookies?.[OIDC_COOKIE.PKCE] as string | undefined;
    const expectedState = parsed?.state;
    const expectedNonce = req.cookies?.[OIDC_COOKIE.NONCE] as string | undefined;

    if (!codeVerifier || !expectedState || !expectedNonce) {
      clearOidcCookies(res);
      throw new Error('OIDC session expired. Start sign-in again.');
    }

    const host = req.get('host') || 'localhost';
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const currentUrl = new URL(req.originalUrl, `${proto}://${host}`);

    let tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers;
    try {
      tokens = await client.authorizationCodeGrant(configuration, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState,
        expectedNonce,
      });
    } catch (e) {
      logger.error('OIDC authorizationCodeGrant failed', e);
      clearOidcCookies(res);
      throw new Error('OIDC sign-in failed. Try again.');
    }

    clearOidcCookies(res);

    const claims = tokens.claims();
    if (!claims) {
      throw new Error('OIDC response did not include ID token claims');
    }

    const sub = claims.sub;
    if (!sub) {
      throw new Error('OIDC id_token missing sub');
    }

    const email =
      (typeof claims.email === 'string' && claims.email) ||
      (typeof (claims as { preferred_username?: string }).preferred_username === 'string' &&
        (claims as { preferred_username?: string }).preferred_username) ||
      '';

    if (!email || !email.includes('@')) {
      throw new Error(
        'OIDC id_token did not include a usable email. Ensure the IdP sends email or preferred_username.',
      );
    }

    const nameFromClaims =
      (typeof claims.name === 'string' && claims.name) ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim();

    const name = nameFromClaims || email.split('@')[0] || 'User';

    const rawGroups = (claims as any).groups ?? (claims as any).roles ?? (claims as any).role;
    const groups: string[] | undefined = Array.isArray(rawGroups)
      ? rawGroups.filter((g) => typeof g === 'string')
      : typeof rawGroups === 'string'
        ? [rawGroups]
        : undefined;

    return {
      issuerUrl: issuer,
      subject: sub,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      groups,
      companyId,
    };
  }
}
