/**
 * invitation-lookup router
 *
 * Public (auth: false) — called from the sign-up page before a Strapi user
 * exists, purely to prefill name fields from the matching pending invitation.
 *
 * Deliberately NOT nested under /invitations/:something — the core router's
 * GET /invitations/:id would otherwise swallow it (Koa/Express route
 * matching treats "lookup" as the :id param), depending on load order.
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/invitation-lookup',
      handler: 'invitation.lookup',
      config: {
        auth: false,
      },
    },
  ],
};
