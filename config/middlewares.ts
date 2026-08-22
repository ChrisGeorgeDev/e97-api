import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'global::uploads-frame-policy',
    config: {
      // Frontend origin(s) allowed to embed uploaded files (portfolio
      // report iframes). Reuses the same env var as the invitation
      // redirect_url rather than introducing a new one.
      allowedOrigins: [process.env.INVESTOR_PORTAL_URL].filter(Boolean),
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      // Preserves the raw request bytes (Symbol.for('unparsedBody')) needed to
      // verify the Clerk webhook's svix signature, which requires the exact
      // bytes Clerk signed rather than the re-serialized JSON.
      includeUnparsed: true,
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
