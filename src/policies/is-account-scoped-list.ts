/**
 * is-account-scoped-list policy
 *
 * Restricts `find` (list) results to entries owned by the requesting user's
 * Account. Mutates the query's filters before the core controller reads it
 * via sanitizeQuery — this must run as a route policy (before the
 * controller), not inside the controller itself.
 *
 * Uses ctx.request.query, NOT ctx.query — the policy context passed in here
 * is built via `Object.assign({is, type}, ctx)` (see @strapi/utils'
 * createPolicyContext), a shallow copy of ctx's OWN enumerable properties.
 * Koa defines `query` as a prototype-level accessor (delegated from
 * Context.prototype to Request.prototype), not an own property, so it's
 * silently dropped by that copy — ctx.query is undefined here and mutating
 * it throws. `request` IS a real own property (assigned directly in Koa's
 * createContext), and request.query is a real getter/setter on that same
 * Request instance, so it reads/writes through to the actual request.
 */

export default (ctx: any) => {
  const account = ctx.state.user?.account;
  if (!account) return false;

  ctx.request.query.filters = {
    $and: [ctx.request.query.filters ?? {}, { account: { documentId: { $eq: account.documentId } } }],
  };

  return true;
};
