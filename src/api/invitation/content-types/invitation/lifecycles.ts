/**
 * invitation lifecycles
 */

export default {
  /**
   * Fires the real Clerk invitation the moment an admin creates an
   * Invitation record in Strapi's content-manager, then writes Clerk's
   * response back onto the record.
   */
  async afterCreate(event: any) {
    const { result } = event;

    const invitation = await strapi.documents('api::invitation.invitation').findOne({
      documentId: result.documentId,
      populate: ['account'],
    });
    if (!invitation) return;

    const clerkInvitation = await strapi
      .service('api::invitation.invitation')
      .createClerkInvitation(invitation);

    await strapi.documents('api::invitation.invitation').update({
      documentId: result.documentId,
      data: {
        clerk_invitation_id: clerkInvitation.id,
        invitation_url: clerkInvitation.url,
        invited_at: new Date(),
        // Clerk's expires_at is already in milliseconds, not seconds.
        invitation_expires_at: clerkInvitation.expires_at
          ? new Date(clerkInvitation.expires_at)
          : undefined,
      },
    });
  },

  /**
   * There is no invitation.revoked webhook from Clerk for plain (non-org)
   * invitations, so revocation must be initiated here rather than reacted to.
   * When an admin flips invitation_status to "revoked" in the content-manager,
   * revoke the real Clerk invitation synchronously.
   */
  async beforeUpdate(event: any) {
    const { data, where } = event.params;
    if (data.invitation_status !== 'revoked') return;

    const invitation = await strapi.documents('api::invitation.invitation').findOne({
      documentId: where.documentId ?? where.id,
    });
    if (!invitation?.clerk_invitation_id) return;

    await strapi.service('api::invitation.invitation').revokeClerkInvitation(invitation.clerk_invitation_id);
  },
};
