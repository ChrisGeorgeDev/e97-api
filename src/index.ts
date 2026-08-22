import type { Core } from '@strapi/strapi';
import { verifyClerkSessionToken } from './utils/clerk-verify';

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
