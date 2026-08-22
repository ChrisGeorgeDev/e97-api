/**
 * invitation controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::invitation.invitation', () => ({
  /**
   * Public, unauthenticated lookup used only to prefill the sign-up form's
   * name fields — there's no Strapi user (and therefore no clerk-jwt auth)
   * yet at this point in the flow. Deliberately returns only first/last
   * name, and returns nulls rather than 404 for a non-matching email so it
   * doesn't double as an "is this email invited" oracle.
   */
  async lookup(ctx: any) {
    const email = ctx.query.email;
    if (!email || typeof email !== 'string') {
      ctx.body = { firstName: null, lastName: null };
      return;
    }

    const invitation = await strapi.documents('api::invitation.invitation').findFirst({
      filters: { email, invitation_status: 'pending' },
    });

    ctx.body = {
      firstName: invitation?.first_name ?? null,
      lastName: invitation?.last_name ?? null,
    };
  },
}));
