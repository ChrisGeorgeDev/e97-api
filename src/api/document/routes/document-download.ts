/**
 * document-download router
 *
 * Nested under the core /documents/:id path but a distinct route pattern
 * (no collision risk the way /invitations/lookup had vs /invitations/:id —
 * that was a same-depth ambiguity, this is one level deeper).
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/documents/:id/download',
      handler: 'document.download',
      config: {
        policies: [
          { name: 'global::is-account-scoped-detail', config: { uid: 'api::document.document' } },
        ],
      },
    },
  ],
};
