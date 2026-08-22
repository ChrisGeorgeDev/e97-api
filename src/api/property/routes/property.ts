/**
 * property router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::property.property', {
  config: {
    find: { policies: ['global::is-account-scoped-list'] },
    findOne: {
      policies: [{ name: 'global::is-account-scoped-detail', config: { uid: 'api::property.property' } }],
    },
  },
});
