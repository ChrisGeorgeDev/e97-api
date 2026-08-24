/**
 * resource controller
 */

import { factories } from '@strapi/strapi';

import { streamAzureFileToCtx } from '../../../utils/azure-download';

export default factories.createCoreController('api::resource.resource', ({ strapi }) => ({
  async download(ctx: any) {
    const entry = await strapi.documents('api::resource.resource').findOne({
      documentId: ctx.params.id,
      populate: ['file'],
    });
    if (!entry?.file) return ctx.notFound();

    await streamAzureFileToCtx(ctx, entry.file.url, {
      filename: `${entry.title}${entry.file.ext ?? ''}`,
      disposition: 'attachment',
    });
  },
}));
