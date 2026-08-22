/**
 * invitation service
 */

import { factories } from '@strapi/strapi';

const CLERK_API_URL = 'https://api.clerk.com/v1';

export default factories.createCoreService('api::invitation.invitation', () => ({
  /**
   * Creates a real Clerk invitation for a Strapi Invitation record and
   * returns Clerk's response (id, url, expires_at). public_metadata carries
   * the target Account so the user.created webhook can link the new Strapi
   * user without re-deriving it.
   */
  async createClerkInvitation(invitation: {
    email: string;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
    account?: { documentId: string };
  }) {
    const response = await fetch(`${CLERK_API_URL}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: invitation.email,
        notify: true,
        ignore_existing: true,
        public_metadata: {
          accountId: invitation.account?.documentId,
          role: invitation.role,
          // Clerk's Invitations API has no first_name/last_name fields of its
          // own — stashed here so they land in the user's public metadata
          // once accepted. The sign-up form doesn't rely on this mid-flow
          // (see the invitation-lookup route); this is a same-data fallback.
          firstName: invitation.first_name ?? undefined,
          lastName: invitation.last_name ?? undefined,
        },
        redirect_url: `${process.env.INVESTOR_PORTAL_URL}/sign-up`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Clerk API error creating invitation: ${response.status} - ${await response.text()}`);
    }

    return response.json() as Promise<{ id: string; url: string; expires_at: number | null }>;
  },

  /**
   * Revokes a Clerk invitation. There is no invitation.revoked webhook to
   * react to, so revocation must be initiated from Strapi's side (via the
   * Invitation lifecycle) rather than reacting to an event from Clerk.
   */
  async revokeClerkInvitation(clerkInvitationId: string) {
    const response = await fetch(`${CLERK_API_URL}/invitations/${clerkInvitationId}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Clerk API error revoking invitation: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  },
}));
