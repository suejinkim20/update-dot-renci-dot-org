import { Issuer, generators } from 'openid-client';

const authority = process.env.AD_AUTHORITY || process.env.VITE_AD_AUTHORITY;
const clientId = process.env.AD_CLIENT_ID || process.env.VITE_AD_CLIENT_ID;
const clientSecret = process.env.AD_CLIENT_SECRET || '';
const scope = process.env.AD_SCOPE || 'openid profile email';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';

let issuerPromise;

function firstForwardedValue(value) {
  if (!value) return null;
  return value.split(',')[0].trim() || null;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, '');
}

function getIssuer() {
  if (!authority) {
    throw new Error('Missing AD_AUTHORITY (or VITE_AD_AUTHORITY) environment variable.');
  }

  if (!issuerPromise) {
    issuerPromise = Issuer.discover(authority);
  }

  return issuerPromise;
}

export function buildBaseUrl(req) {
  if (publicBaseUrl) {
    return normalizeBaseUrl(publicBaseUrl);
  }

  const forwardedProto = firstForwardedValue(req.get('x-forwarded-proto'));
  const forwardedHost = firstForwardedValue(req.get('x-forwarded-host'));
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');

  return `${protocol}://${host}`;
}

export function buildCallbackUrl(req) {
  return `${buildBaseUrl(req)}/auth/callback`;
}

export async function getOidcClient(req) {
  if (!clientId) {
    throw new Error('Missing AD_CLIENT_ID (or VITE_AD_CLIENT_ID) environment variable.');
  }

  const issuer = await getIssuer();
  const redirectUri = buildCallbackUrl(req);

  return new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret || undefined,
    redirect_uris: [redirectUri],
    response_types: ['code'],
    token_endpoint_auth_method: clientSecret ? 'client_secret_post' : 'none',
  });
}

export function createAuthorizationParams() {
  const state = generators.state();
  const nonce = generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  return {
    authorizationParams: {
      scope,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    },
    flowState: {
      state,
      nonce,
      codeVerifier,
    },
  };
}

export function getSessionUser(claims) {
  const email = claims.email || claims.upn || claims.preferred_username || claims.unique_name;
  const name = claims.name || claims.display_name || email || claims.sub;

  if (!email) {
    throw new Error('Identity provider did not return an email-like identifier.');
  }

  return {
    sub: claims.sub,
    name,
    email,
  };
}
