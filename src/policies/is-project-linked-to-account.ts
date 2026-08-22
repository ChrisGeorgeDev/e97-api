/**
 * is-project-linked-to-account policy
 *
 * Project is shared/global (no direct Account relation) — visibility is
 * derived through the Investment join instead of an owner field. Used for
 * both `find` and `findOne` on the project route; distinguishes the two by
 * the presence of ctx.params.id.
 */

export default async (ctx: any, config: unknown, { strapi }: { strapi: any }) => {
  const account = ctx.state.user?.account;
  if (!account) return false;

  if (ctx.params?.id) {
    const linkedInvestment = await strapi.documents('api::investment.investment').findFirst({
      filters: { project: ctx.params.id, account: account.documentId },
    });
    return !!linkedInvestment;
  }

  // ctx.request.query, not ctx.query — see is-account-scoped-list.ts for why
  // (ctx.query is a prototype accessor, dropped by the policy context's
  // shallow Object.assign copy; ctx.request is a real own property).
  ctx.request.query.filters = {
    $and: [
      ctx.request.query.filters ?? {},
      { investments: { account: { documentId: { $eq: account.documentId } } } },
    ],
  };

  return true;
};
