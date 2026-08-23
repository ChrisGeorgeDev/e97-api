/**
 * interest-registration controller
 */

import { factories } from '@strapi/strapi';

import { sendInterestRegistrationEmail } from '../../../utils/resend';

export default factories.createCoreController(
  'api::interest-registration.interest-registration',
  ({ strapi }) => ({
    /**
     * Fully replaces the default create action — account and investorUser
     * must be derived from the authenticated Clerk-verified user
     * (ctx.state.user), never trusted from the request body, so an investor
     * can only ever register interest for their own account.
     *
     * Idempotent per account+opportunity: a second submission (e.g. a
     * double-click, or revisiting after already registering) returns the
     * existing record instead of creating a duplicate or re-sending the
     * notification email.
     */
    async create(ctx: any) {
      const user = ctx.state.user;
      const account = user?.account;
      if (!account) return ctx.forbidden();

      const { opportunity: opportunityDocumentId, amount, acknowledged } = ctx.request.body?.data ?? {};

      if (!opportunityDocumentId || typeof amount !== 'number' || amount <= 0) {
        return ctx.badRequest('A positive amount and opportunity are required');
      }
      if (acknowledged !== true) {
        return ctx.badRequest('Acknowledgement of capital call terms is required');
      }

      const opportunity = await strapi
        .documents('api::investment-opportunity.investment-opportunity')
        .findOne({ documentId: opportunityDocumentId });
      if (!opportunity) return ctx.notFound('Opportunity not found');

      const existing = await strapi
        .documents('api::interest-registration.interest-registration')
        .findFirst({
          filters: {
            account: { documentId: { $eq: account.documentId } },
            opportunity: { documentId: { $eq: opportunityDocumentId } },
          },
        });
      if (existing) {
        ctx.body = { data: existing };
        return;
      }

      const registration = await strapi
        .documents('api::interest-registration.interest-registration')
        .create({
          data: {
            amount,
            acknowledgedCapitalCalls: true,
            account: account.documentId,
            investorUser: user.documentId,
            opportunity: opportunityDocumentId,
          },
        });

      try {
        await sendInterestRegistrationEmail({
          investorName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email,
          accountName: account.name,
          opportunityTitle: opportunity.title ?? 'Investment Opportunity',
          amount,
        });
      } catch (error) {
        // The registration is already durably saved — a notification-email
        // failure shouldn't fail the investor's submission. Logged so it can
        // be followed up on manually.
        strapi.log.error('Failed to send interest registration email', error);
      }

      ctx.body = { data: registration };
    },
  })
);
