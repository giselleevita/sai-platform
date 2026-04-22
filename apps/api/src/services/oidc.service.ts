import type { Request, Response } from 'express';
import * as client from 'openid-client';
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

let cachedDiscovery: { issuer: string; configuration: client.Configuration } | null = null;

async function getOidcConfiguration(): Promise<client.Configuration> {
  if (!isOidcConfigured() || !config.oidc.issuer || !config.oidc.clientId || !config.oidc.clientSecret) {
    throw new Error('OIDC is not configured');
  }

  if (cachedDiscovery?.issuer === config.oidc.issuer) {
    return cachedDiscovery.configuration;
  }

  const redirectUri = config.oidc.redirectUri as string;

  const configuration = await client.discovery(
    new URL(config.oidc.issuer),
    config.oidc.clientId,
    { redirect_uris: [redirectUri] },
    client.ClientSecretPost(config.oidc.clientSecret),
  );

  cachedDiscovery = { issuer: config.oidc.issuer, configuration };
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
  static async startLogin(res: Response): Promise<void> {
    if (!isOidcConfigured()) {
      throw new Error('OIDC is not configured');
    }
    const configuration = await getOidcConfiguration();
    if (!config.oidc.redirectUri) {
      throw new Error('OIDC_REDIRECT_URI is required');
    }

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    const redirectTo = client.buildAuthorizationUrl(configuration, {
      redirect_uri: config.oidc.redirectUri,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    const maxAge = 10 * 60 * 1000;
    res.cookie(OIDC_COOKIE.PKCE, codeVerifier, COOKIE_OPTS(maxAge));
    res.cookie(OIDC_COOKIE.STATE, state, COOKIE_OPTS(maxAge));
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
  }> {
    const configuration = await getOidcConfiguration();
    if (!config.oidc.issuer || !config.oidc.redirectUri) {
      throw new Error('OIDC is not configured');
    }

    const codeVerifier = req.cookies?.[OIDC_COOKIE.PKCE] as string | undefined;
    const expectedState = req.cookies?.[OIDC_COOKIE.STATE] as string | undefined;
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

    return {
      issuerUrl: config.oidc.issuer,
      subject: sub,
      email: email.trim().toLowerCase(),
      name: name.trim(),
    };
  }
}
