/**
 * is-account-scoped-detail policy
 *
 * Restricts `findOne` to a single entry owned by the requesting user's
 * Account. The core findOne controller resolves by ctx.params.id (a
 * documentId in Strapi 5) and ignores query filters, so this must fetch the
 * entry and compare its Account relation directly rather than mutating the
 * query like the list policy does.
 *
 * Requires `config: { uid: '<content-type-uid>' }` on the route.
 */

export default async (ctx: any, config: { uid: string }, { strapi }: { strapi: any }) => {
  const account = ctx.state.user?.account;
  if (!account) return false;

  const entry = await strapi.documents(config.uid).findOne({
    documentId: ctx.params.id,
    populate: ['account'],
  });

  return !!entry && entry.account?.documentId === account.documentId;
};
