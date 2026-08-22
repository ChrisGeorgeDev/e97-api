/**
 * project router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::project.project', {
  config: {
    find: { policies: ['global::is-project-linked-to-account'] },
    findOne: { policies: ['global::is-project-linked-to-account'] },
  },
});
