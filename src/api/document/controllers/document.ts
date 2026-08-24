/**
 * document controller
 */

import { factories } from '@strapi/strapi';

import { streamAzureFileToCtx } from '../../../utils/azure-download';

export default factories.createCoreController('api::document.document', ({ strapi }) => ({
  async download(ctx: any) {
    const entry = await strapi.documents('api::document.document').findOne({
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
