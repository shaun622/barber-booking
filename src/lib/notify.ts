import type { Booking, Service, Barber } from './db';

type Env = App.Platform['env'];

interface NotifyContext {
  booking: Booking;
  baseService: Service;
  addons: Service[];
  barber: Barber | null;
  env: Env;
}

const MAPS_DIRECTIONS = 'https://www.google.com/maps/dir/?api=1&destination=-8.7040087,115.2539749';
const SHOP_ADDRESS = 'Jl. Bypass Ngurah Rai No.50xx, Sanur, Denpasar Selatan, Bali 80227';

function formatIDR(n: number): string {
  return 'IDR ' + n.toLocaleString('id-ID');
}

function formatWitaTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]} WITA`;
}

function serviceLines(ctx: NotifyContext): { name: string; price: number; from: boolean }[] {
  return [ctx.baseService, ...ctx.addons].map((s) => ({
    name: s.name_en,
    price: s.price_idr,
    from: !!s.price_from_only
  }));
}

/* ───────────────────────── Owner notification ───────────────────────── */

function buildOwnerSummary(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const services = serviceLines(ctx)
    .map((s) => `- ${s.name}${s.from ? ' (from)' : ''}: ${formatIDR(s.price)}`)
    .join('\n');
  return [
    `New booking #${booking.id}`,
    ``,
    `Name: ${booking.customer_name}`,
    `WhatsApp: ${booking.whatsapp_phone}`,
    booking.email ? `Email: ${booking.email}` : '',
    `When: ${formatWitaTime(booking.starts_at)} (${booking.duration_min_total} min)`,
    `Barber: ${barber ? barber.name : 'Any available'}`,
    booking.address ? `Address: ${booking.address}` : '',
    ``,
    `Services:`,
    services,
    ``,
    `Total: ${formatIDR(booking.price_idr_total)}`,
    ``,
    `Reply on WhatsApp: https://wa.me/${booking.whatsapp_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      booking.language === 'id'
        ? `Halo ${booking.customer_name}, konfirmasi booking di Balis Barber: ${formatWitaTime(booking.starts_at)}. Terima kasih!`
        : `Hi ${booking.customer_name}, confirming your Balis Barber booking on ${formatWitaTime(booking.starts_at)}. See you then!`
    )}`
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendOwnerEmail(ctx: NotifyContext, body: string): Promise<void> {
  const { env } = ctx;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.EMAIL_TO_OWNER) {
    console.warn('[notify] owner email skipped — env not configured');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: env.EMAIL_TO_OWNER,
      subject: `New booking #${ctx.booking.id} — ${ctx.booking.customer_name}`,
      text: body
    })
  });
  if (!res.ok) console.error('[notify] owner email failed', res.status, await res.text());
}

async function sendOwnerWhatsApp(ctx: NotifyContext, body: string): Promise<void> {
  const { env } = ctx;
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_OWNER_NUMBER) {
    console.warn('[notify] owner whatsapp skipped — env not configured');
    return;
  }
  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: env.WHATSAPP_OWNER_NUMBER,
      type: 'text',
      text: { body }
    })
  });
  if (!res.ok) console.error('[notify] owner whatsapp failed', res.status, await res.text());
}

export async function notifyOwner(ctx: NotifyContext): Promise<void> {
  const body = buildOwnerSummary(ctx);
  await Promise.allSettled([sendOwnerEmail(ctx, body), sendOwnerWhatsApp(ctx, body)]);
}

/* ─────────────────────── Customer confirmation email ─────────────────────── */

function customerCopy(lang: 'en' | 'id') {
  return lang === 'id'
    ? {
        subject: 'Booking diterima — Balis Barber',
        hi: (n: string) => `Halo ${n},`,
        intro:
          'Terima kasih! Kami telah menerima permintaan booking Anda. Tim kami akan menghubungi Anda via WhatsApp untuk mengonfirmasi.',
        when: 'Waktu',
        barber: 'Barber',
        any: 'Barber mana saja',
        services: 'Layanan',
        total: 'Total',
        location: 'Lokasi',
        directions: 'Petunjuk arah',
        outro: 'Sampai jumpa di Balis Barber!',
        ref: 'Referensi'
      }
    : {
        subject: 'Booking received — Balis Barber',
        hi: (n: string) => `Hi ${n},`,
        intro:
          'Thank you! We’ve received your booking request. Our team will message you on WhatsApp shortly to confirm.',
        when: 'When',
        barber: 'Barber',
        any: 'Any barber',
        services: 'Services',
        total: 'Total',
        location: 'Location',
        directions: 'Get directions',
        outro: 'See you at Balis Barber!',
        ref: 'Reference'
      };
}

function buildCustomerText(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const t = customerCopy(booking.language);
  const services = serviceLines(ctx)
    .map((s) => `- ${s.name}: ${s.from ? 'from ' : ''}${formatIDR(s.price)}`)
    .join('\n');
  return [
    t.hi(booking.customer_name),
    '',
    t.intro,
    '',
    `${t.when}: ${formatWitaTime(booking.starts_at)}`,
    `${t.barber}: ${barber ? barber.name : t.any}`,
    '',
    `${t.services}:`,
    services,
    `${t.total}: ${formatIDR(booking.price_idr_total)}`,
    '',
    `${t.location}: ${SHOP_ADDRESS}`,
    `${t.directions}: ${MAPS_DIRECTIONS}`,
    '',
    t.outro,
    `${t.ref}: #${booking.id}`
  ].join('\n');
}

function buildCustomerHtml(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const t = customerCopy(booking.language);
  const rows = serviceLines(ctx)
    .map(
      (s) =>
        `<tr><td style="padding:4px 0;color:#2a241c">${s.name}</td><td style="padding:4px 0;text-align:right;color:#2a241c;white-space:nowrap">${s.from ? 'from ' : ''}${formatIDR(s.price)}</td></tr>`
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#f4efe5;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px">
    <div style="font-size:22px;font-weight:700;letter-spacing:.5px;color:#2a241c">BALIS<span style="color:#9d7c34">.</span>BARBER</div>
    <div style="height:1px;background:rgba(201,169,97,.4);margin:18px 0"></div>
    <p style="color:#2a241c;font-size:16px;margin:0 0 6px">${t.hi(booking.customer_name)}</p>
    <p style="color:#6e665a;font-size:14px;line-height:1.6;margin:0 0 20px">${t.intro}</p>
    <div style="background:#fffdf8;border:1px solid rgba(201,169,97,.25);border-radius:14px;padding:18px">
      <p style="margin:0 0 4px;color:#6e665a;font-size:12px;text-transform:uppercase;letter-spacing:.12em">${t.when}</p>
      <p style="margin:0 0 14px;color:#2a241c;font-size:16px;font-weight:600">${formatWitaTime(booking.starts_at)} · ${barber ? barber.name : t.any}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:10px 0 0;border-top:1px solid rgba(201,169,97,.25);color:#2a241c;font-weight:700">${t.total}</td>
        <td style="padding:10px 0 0;border-top:1px solid rgba(201,169,97,.25);text-align:right;color:#2a241c;font-weight:700;white-space:nowrap">${formatIDR(booking.price_idr_total)}</td></tr>
      </table>
    </div>
    <p style="color:#6e665a;font-size:13px;line-height:1.6;margin:18px 0 6px">${t.location}</p>
    <p style="color:#2a241c;font-size:14px;margin:0 0 12px">${SHOP_ADDRESS}</p>
    <a href="${MAPS_DIRECTIONS}" style="display:inline-block;background:#c9a961;color:#2a241c;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px">${t.directions}</a>
    <p style="color:#6e665a;font-size:14px;margin:24px 0 0">${t.outro}</p>
    <p style="color:#9a9182;font-size:12px;margin:6px 0 0">${t.ref}: #${booking.id}</p>
  </div></body></html>`;
}

async function sendCustomerEmail(ctx: NotifyContext): Promise<void> {
  const { env, booking } = ctx;
  if (!booking.email) return; // customer didn't provide one
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn('[notify] customer email skipped — env not configured');
    return;
  }
  const t = customerCopy(booking.language);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: booking.email,
      subject: t.subject,
      text: buildCustomerText(ctx),
      html: buildCustomerHtml(ctx)
    })
  });
  if (!res.ok) console.error('[notify] customer email failed', res.status, await res.text());
}

export async function notifyCustomer(ctx: NotifyContext): Promise<void> {
  await sendCustomerEmail(ctx);
}

/* ───────────────────────── Combined entry point ───────────────────────── */

export async function sendBookingNotifications(ctx: NotifyContext): Promise<void> {
  await Promise.allSettled([notifyOwner(ctx), notifyCustomer(ctx)]);
}
