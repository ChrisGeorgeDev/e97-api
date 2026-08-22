/**
 * portfolio-report router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::portfolio-report.portfolio-report', {
  config: {
    find: { policies: ['global::is-account-scoped-list'] },
    findOne: {
      policies: [
        { name: 'global::is-account-scoped-detail', config: { uid: 'api::portfolio-report.portfolio-report' } },
      ],
    },
  },
});
