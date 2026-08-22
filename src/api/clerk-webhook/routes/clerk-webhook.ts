/**
 * clerk-webhook router
 *
 * Public route (auth: false) — verified instead via svix signature inside
 * the controller, since this isn't a Strapi user calling in.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/clerk-webhook',
      handler: 'clerk-webhook.handle',
      config: {
        auth: false,
      },
    },
  ],
};
