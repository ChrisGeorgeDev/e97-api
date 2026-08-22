import { verifyToken } from '@clerk/backend';

type ClerkJwtPayload = Awaited<ReturnType<typeof verifyToken>>;

/**
 * Verifies a Clerk session token against Clerk's JWKS. Throws on any
 * invalid/expired/wrong-party token — callers must treat a thrown error as
 * "not authenticated", never as "create a new user."
 *
 * Prefers CLERK_JWT_KEY (the PEM public key from the Clerk Dashboard) for
 * networkless verification, per Clerk's current guidance — falls back to
 * CLERK_SECRET_KEY (which fetches/caches JWKS over the network) if unset.
 */
export async function verifyClerkSessionToken(token: string): Promise<ClerkJwtPayload> {
  const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return verifyToken(token, {
    jwtKey: process.env.CLERK_JWT_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    authorizedParties,
  });
}
