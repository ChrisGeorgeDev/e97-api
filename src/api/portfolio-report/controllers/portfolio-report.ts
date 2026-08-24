/**
 * portfolio-report controller
 */

import { factories } from '@strapi/strapi';

import { streamAzureFileToCtx } from '../../../utils/azure-download';

export default factories.createCoreController('api::portfolio-report.portfolio-report', ({ strapi }) => ({
  async download(ctx: any) {
    const entry = await strapi.documents('api::portfolio-report.portfolio-report').findOne({
      documentId: ctx.params.id,
      populate: ['report'],
    });
    if (!entry?.report) return ctx.notFound();

    // Self-contained HTML report meant to render inline in the dashboard's
    // iframe, not prompt a save dialog — inline disposition, forced
    // text/html regardless of whatever content-type Azure stored.
    await streamAzureFileToCtx(ctx, entry.report.url, {
      filename: `${entry.title}.html`,
      disposition: 'inline',
      contentType: 'text/html',
    });
  },
}));
