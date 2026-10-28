// POST /api/waitlist: puts an email on the PettyPawn waitlist (D1 database pettypawn-waitlist, bound as DB).
// Body: { email, platform?: 'ios' | 'android' (the device the page was opened on), source?, trap? (a hidden field
// only bots fill) }.
// One write per signup: the email is the table's primary key, so ON CONFLICT DO NOTHING tells a new signup
// ({ status: 'joined' }, 201) from one already on the list ({ status: 'already' }, 200) without a second query.
// Errors: { error } with 400, 403, 405, 413 or 500.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PLATFORMS = new Set(['ios', 'android']);
const MAX_BODY = 2000;

function reply(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

// Browsers send Origin on a POST; a page on another site may not post here. Clients that send none are let through.
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, { allow: 'POST' });
  if (!sameOrigin(request)) return reply({ error: 'forbidden' }, 403);

  const text = await request.text();
  if (text.length > MAX_BODY) return reply({ error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: 'bad_request' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'bad_request' }, 400);

  // A bot that fills the hidden field gets the answer a person would, and nothing is stored.
  if (body.trap) return reply({ status: 'joined' }, 201);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL.test(email)) return reply({ error: 'invalid_email' }, 400);
  const platform = PLATFORMS.has(body.platform) ? body.platform : null;
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 64) : null;
  const country = typeof request.cf?.country === 'string' ? request.cf.country : null;

  try {
    const { meta } = await env.DB
      .prepare('INSERT INTO waitlist (email, platform, source, country) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (email) DO NOTHING')
      .bind(email, platform, source, country)
      .run();
    return meta.changes > 0 ? reply({ status: 'joined' }, 201) : reply({ status: 'already' });
  } catch (err) {
    console.error('waitlist insert failed', err);
    return reply({ error: 'server' }, 500);
  }
}
