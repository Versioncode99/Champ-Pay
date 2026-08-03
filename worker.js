/**
 * ChampPay — Worker entry point.
 *
 * Serves everything in public/ as static assets, and handles the one dynamic
 * route the site has. `functions/` is a Pages convention that the Workers
 * runtime does not read on its own, so the contact handler is wired up here.
 */
import { onRequestPost } from './functions/api/contact.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'POST' }
        });
      }
      return onRequestPost({ request, env });
    }

    return env.ASSETS.fetch(request);
  }
};
