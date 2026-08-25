import express from 'express';
import { buildCallbackUrl, createAuthorizationParams, getOidcClient, getSessionUser } from '../services/oidc.js';

const router = express.Router();

function sanitizeReturnTo(value) {
  if (typeof value !== 'string' || value.length === 0) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/auth/')) return '/';
  return value;
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

router.get('/login', async (req, res) => {
  try {
    const returnTo = sanitizeReturnTo(req.query.returnTo);

    if (req.user) {
      return res.redirect(returnTo);
    }

    const client = await getOidcClient(req);
    const { authorizationParams, flowState } = createAuthorizationParams();

    req.session.authFlow = {
      ...flowState,
      returnTo,
    };

    await saveSession(req);

    return res.redirect(client.authorizationUrl(authorizationParams));
  } catch (err) {
    console.error('GET /auth/login error:', err);
    return res.redirect('/login?error=signin_unavailable');
  }
});

router.get('/callback', async (req, res) => {
  const authFlow = req.session.authFlow;

  if (typeof req.query.error === 'string') {
    delete req.session.authFlow;
    await saveSession(req).catch(() => {});
    return res.redirect('/login?error=signin_failed');
  }

  if (!authFlow) {
    return res.redirect('/login?error=session_expired');
  }

  try {
    const client = await getOidcClient(req);
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(buildCallbackUrl(req), params, {
      code_verifier: authFlow.codeVerifier,
      state: authFlow.state,
      nonce: authFlow.nonce,
    });

    const user = getSessionUser(tokenSet.claims());
    const returnTo = sanitizeReturnTo(authFlow.returnTo);

    await regenerateSession(req);
    req.session.user = user;
    await saveSession(req);

    return res.redirect(returnTo);
  } catch (err) {
    console.error('GET /auth/callback error:', err);
    return res.redirect('/login?error=signin_failed');
  }
});

router.post('/logout', async (req, res) => {
  try {
    if (!req.session) {
      return res.status(204).end();
    }

    await destroySession(req);
    res.clearCookie('update_renci_session');
    return res.status(204).end();
  } catch (err) {
    console.error('POST /auth/logout error:', err);
    return res.status(500).json({ message: 'Failed to sign out.' });
  }
});

export default router;
