import { Webhook } from 'svix';

/**
 * Verifies and handles Clerk webhooks. Hosted in Strapi (not Next.js) so the
 * account/role linkage for a newly accepted invitation is established by the
 * same system that enforces access to that data, rather than depending on a
 * second app's deploy correctness.
 */
export default {
  async handle(ctx: any) {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    const rawBody = ctx.request.body?.[Symbol.for('unparsedBody')];

    if (!signingSecret || !rawBody) {
      return ctx.badRequest('Missing webhook signature material');
    }

    let event: any;
    try {
      const webhook = new Webhook(signingSecret);
      event = webhook.verify(rawBody, {
        'svix-id': ctx.request.header['svix-id'],
        'svix-timestamp': ctx.request.header['svix-timestamp'],
        'svix-signature': ctx.request.header['svix-signature'],
      });
    } catch {
      return ctx.badRequest('Invalid webhook signature');
    }

    if (event.type === 'user.created') {
      await handleUserCreated(event.data);
    } else if (event.type === 'user.updated') {
      await handleUserUpdated(event.data);
    }

    ctx.body = { ok: true };
  },
};

/** Clerk's email_addresses[0] isn't reliably the primary — resolve via primary_email_address_id. */
function getPrimaryEmail(data: any): string | undefined {
  const emails = data.email_addresses ?? [];
  const primary = emails.find((e: any) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? emails[0]?.email_address;
}

async function handleUserCreated(data: any) {
  const email = getPrimaryEmail(data);
  if (!email) return;

  const invitation = await strapi.documents('api::invitation.invitation').findFirst({
    filters: { email, invitation_status: 'pending' },
    populate: ['account'],
  });
  if (!invitation?.account) return;

  const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });
  if (!authenticatedRole) return;

  const user = await strapi.documents('plugin::users-permissions.user').create({
    data: {
      username: email,
      email,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      clerk_id: data.id,
      account: invitation.account.documentId,
      role: authenticatedRole.id,
      confirmed: true,
      password: crypto.randomUUID(),
    },
  });

  await strapi.documents('api::invitation.invitation').update({
    documentId: invitation.documentId,
    data: {
      invitation_status: 'accepted',
      accepted_at: new Date(),
      accepted_by_user: user.documentId,
    },
  });
}

/** Keeps the Strapi user in sync when an investor updates their name or email in Clerk. */
async function handleUserUpdated(data: any) {
  const user = await strapi.documents('plugin::users-permissions.user').findFirst({
    filters: { clerk_id: data.id },
  });
  if (!user) return;

  const email = getPrimaryEmail(data);

  await strapi.documents('plugin::users-permissions.user').update({
    documentId: user.documentId,
    data: {
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      ...(email ? { email, username: email } : {}),
    },
  });
}
