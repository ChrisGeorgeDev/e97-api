/**
 * resource-download router
 *
 * No account-scoping policy — Resource is intentionally global (any
 * authenticated investor), same visibility model as its find/findOne
 * routes. Normal clerk-jwt auth still applies (no auth: false).
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/resources/:id/download',
      handler: 'resource.download',
    },
  ],
};
