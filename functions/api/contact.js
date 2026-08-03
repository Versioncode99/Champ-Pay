/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Requires two environment variables set in the Cloudflare Pages project
 * (Settings → Environment variables). Until they are set, this endpoint
 * returns 503 and the form surfaces a "not configured yet" message rather
 * than silently swallowing enquiries.
 *
 *   RESEND_API_KEY  — API key from https://resend.com (free tier is sufficient)
 *   CONTACT_TO      — destination address for enquiries
 *   CONTACT_FROM    — optional; defaults to onboarding@resend.dev until a
 *                     sending domain is verified on champ-pay.com
 */

const MAX = { name: 120, email: 200, company: 200, capacity: 80, message: 5000 };

function clean(value, limit) {
  return String(value ?? '').trim().slice(0, limit);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export async function onRequestPost({ request, env }) {
  const json = (body, status) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  // Honeypot — a bot filled a field no person can see.
  if (clean(data.website, 50)) return json({ ok: true }, 200);

  const name = clean(data.name, MAX.name);
  const email = clean(data.email, MAX.email);
  const company = clean(data.company, MAX.company);
  const capacity = clean(data.capacity, MAX.capacity);
  const message = clean(data.message, MAX.message);

  if (!name || !company || !capacity || message.length < 20) {
    return json({ error: 'Please complete every field.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: 'That email address is not complete.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    return json(
      { error: 'The mail route is not configured on this deployment yet.' },
      503
    );
  }

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Company', company],
    ['Capacity', capacity]
  ]
    .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0"><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join('');

  const html =
    `<h2 style="font-family:sans-serif">New enquiry — champ-pay.com</h2>` +
    `<table style="font-family:sans-serif;font-size:14px">${rows}</table>` +
    `<hr><p style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'ChampPay Site <onboarding@resend.dev>',
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `ChampPay enquiry — ${company} (${capacity})`,
        html
      })
    });

    if (!res.ok) {
      return json({ error: 'The message could not be delivered.' }, 502);
    }
    return json({ ok: true }, 200);
  } catch {
    return json({ error: 'The message could not be delivered.' }, 502);
  }
}

export function onRequestGet() {
  return new Response('Method not allowed', { status: 405 });
}
