import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { verifyClerkSessionToken } from './utils/clerk-verify';

const { ForbiddenError, UnauthorizedError } = errors;

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.get('auth').register('content-api', {
      name: 'clerk-jwt',
      authenticate: async (ctx: any) => {
        const authHeader = ctx.request.header.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
        if (!token) return { authenticated: false };

        let payload;
        try {
          payload = await verifyClerkSessionToken(token);
        } catch {
          return { authenticated: false };
        }

        // Fail closed: an unrecognized Clerk user must NOT be auto-provisioned here.
        // Account/role linkage is only ever established by the invitation-acceptance
        // webhook (see src/api/clerk-webhook), so a clerk_id with no matching Strapi
        // user is simply unauthenticated.
        const user = await strapi.documents('plugin::users-permissions.user').findFirst({
          filters: { clerk_id: payload.sub },
          populate: ['account', 'role'],
        });
        if (!user || user.blocked || !user.role) return { authenticated: false };

        const permissionService = strapi.plugin('users-permissions').service('permission');
        const permissions = await permissionService
          .findRolePermissions(user.role.id)
          .then((perms: any[]) => perms.map(permissionService.toContentAPIPermission));
        const ability = await strapi.contentAPI.permissions.engine.generateAbility(permissions);

        ctx.state.user = user;
        return { authenticated: true, credentials: user, ability };
      },

      /**
       * Without this, Strapi's core authService.verify() silently no-ops for
       * every Clerk-authenticated request — it only invokes strategy.verify
       * if the strategy defines one (see @strapi/core's services/auth/index.js).
       * That means the Authenticated role's permission checkboxes (Settings →
       * Users & Permissions → Roles) were never actually enforced for ANY
       * Clerk-authenticated user, on any action — core or custom — only
       * whatever policies happened to be attached (e.g. account-scoping)
       * were doing any gating. Mirrors the official content-api-token
       * strategy's verify() (@strapi/admin's strategies/content-api-token.js)
       * — every content-api route gets an auto-generated required scope
       * (e.g. `api::document.document.download`) via
       * @strapi/core's register-routes.js, regardless of whether the route
       * was created via createCoreRouter or a plain custom route file.
       */
      verify: async (auth: any, config: any) => {
        const { credentials: user, ability } = auth;
        if (!user) throw new UnauthorizedError();
        if (!config?.scope) return;

        if (!ability) throw new ForbiddenError();
        const scopes = Array.isArray(config.scope) ? config.scope : [config.scope];
        if (!scopes.every((scope: string) => ability.can(scope))) {
          throw new ForbiddenError();
        }
      },
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
