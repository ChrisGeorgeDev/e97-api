/**
 * project router
 *
 * No scoping policy — Project is a shared update visible to every
 * logged-in investor, same as News.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::project.project');
