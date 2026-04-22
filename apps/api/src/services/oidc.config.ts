import { config } from '../config';

/** True when all OIDC env vars are set (issuer, client, secret, redirect). */
export function isOidcConfigured(): boolean {
  return Boolean(
    config.oidc.issuer && config.oidc.clientId && config.oidc.clientSecret && config.oidc.redirectUri,
  );
}
