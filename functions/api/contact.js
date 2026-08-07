/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Requires two secrets on the **Worker** `champ-pay`. Corrected 2026-08-06:
 * this said "the Cloudflare Pages project (Settings → Environment variables)",
 * which is the wrong product — the site has been served by a Worker since the
 * 2026-08-03 restructure, and there is no Pages project to configure.
 *
 * Set them either way:
 *   npx wrangler secret put RESEND_API_KEY     (prompts; the value is not echoed)
 *   npx wrangler secret put CONTACT_TO
 * or dash.cloudflare.com → Workers & Pages → champ-pay → Settings → Variables
 * and secrets → Add → type "Secret".
 *
 * Note: the Cloudflare MCP servers cannot do this — they expose Workers read,
 * D1, KV, R2 and Hyperdrive, but no secret-setting tool.
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
  const text =
    `New enquiry — champ-pay.com\n\n` +
    `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nCapacity: ${capacity}\n\n${message}`;

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
        html,
        text
      })
    });

    if (!res.ok) {
      // Keep the visitor-facing response generic, but leave the provider's
      // status and request ID in Worker logs so delivery faults are diagnosable
      // without logging enquiry content or secrets.
      console.error('Resend contact delivery failed', {
        status: res.status,
        requestId: res.headers.get('x-resend-request-id') || res.headers.get('cf-ray') || 'unavailable',
        provider: await res.text()
      });
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
