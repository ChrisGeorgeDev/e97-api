/**
 * document router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::document.document', {
  config: {
    find: { policies: ['global::is-account-scoped-list'] },
    findOne: {
      policies: [{ name: 'global::is-account-scoped-detail', config: { uid: 'api::document.document' } }],
    },
  },
});
