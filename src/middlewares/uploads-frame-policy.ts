/**
 * uploads-frame-policy middleware
 *
 * Strapi's default security middleware (koa-helmet, via `strapi::security`)
 * sends `X-Frame-Options: SAMEORIGIN` on every response, including static
 * file serving under /uploads. That blocks the Next.js frontend (a
 * different origin) from embedding an uploaded self-contained HTML
 * portfolio report in an iframe — the browser refuses to render it.
 *
 * Scoped narrowly to /uploads only (registered after `strapi::security` in
 * config/middlewares.ts) so the admin panel and every other response keep
 * their normal clickjacking protection — only the actual uploaded files
 * become embeddable, and only by the configured frontend origin(s).
 */

export default (config: { allowedOrigins?: string[] }) => {
  const allowedOrigins = config.allowedOrigins ?? [];

  return async (ctx: any, next: any) => {
    await next();

    if (!ctx.path.startsWith('/uploads')) return;

    ctx.remove('X-Frame-Options');
    ctx.set('Content-Security-Policy', `frame-ancestors 'self' ${allowedOrigins.join(' ')}`.trim());
  };
};
