import subscription from './worker.js';

async function forwardTunnel(request, env) {
  const upstream = new URL(env.TUNNEL_ORIGIN || 'https://catan-cw5.pages.dev');
  const incoming = new URL(request.url);
  upstream.pathname = incoming.pathname;
  upstream.search = incoming.search;
  const forwarded = new Request(upstream, request);
  const response = await fetch(forwarded, { redirect: 'manual' });
  // Return the WebSocket upgrade untouched.
  if (response.status === 101) return response;
  const headers = new Headers(response.headers);
  const location = headers.get('location');
  if (location) {
    const destination = new URL(location, upstream);
    if (destination.origin === upstream.origin) {
      destination.protocol = incoming.protocol;
      destination.host = incoming.host;
      headers.set('location', destination.toString());
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // An upgrade always belongs to the existing tunnel, regardless of path.
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      return forwardTunnel(request, env);
    }
    const subscriptionPath =
      url.pathname === '/api/generate' ||
      /^\/sub\/[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{10}$/.test(url.pathname);
    const assetPath =
      url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname === '/app.js' ||
      url.pathname === '/styles.css' ||
      url.pathname.startsWith('/icons/');
    if (subscriptionPath || assetPath) {
      return subscription.fetch(request, env, ctx);
    }
    return forwardTunnel(request, env);
  },
};
