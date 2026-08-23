/**
 * interest-registration router
 *
 * find/findOne reuse the same account-scoping policies as Document/Property/
 * PortfolioReport. create is NOT policy-scoped here — it's locked down
 * instead by fully overriding the controller action (see
 * ../controllers/interest-registration.ts), since the account/investorUser
 * on a new record must be derived from the authenticated user, not filtered
 * after the fact.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::interest-registration.interest-registration', {
  config: {
    find: { policies: ['global::is-account-scoped-list'] },
    findOne: {
      policies: [
        {
          name: 'global::is-account-scoped-detail',
          config: { uid: 'api::interest-registration.interest-registration' },
        },
      ],
    },
  },
});
