import type { Booking, Service, Barber } from './db';

type Env = App.Platform['env'];

interface NotifyContext {
  booking: Booking;
  baseService: Service;
  addons: Service[];
  barber: Barber | null;
  env: Env;
}

const SHOP_ADDRESS = 'Jl. Bypass Ngurah Rai No.50xx, Sanur, Denpasar Selatan, Bali 80227';
const MAPS_DIRECTIONS = 'https://www.google.com/maps/dir/?api=1&destination=-8.7040087,115.2539749';
const SHOP_WA = '6281337995251';
const SHOP_WA_PRETTY = '+62 813 3799 5251';

/* ── palette (inline for email clients) ── */
const C = {
  cream: '#f4efe5',
  ivory: '#fffdf8',
  panel: '#f7f2e9',
  charcoal: '#1c1814',
  ink: '#2a241c',
  meta: '#6e665a',
  faint: '#9a9182',
  bone: '#f5f1e8',
  boneDim: '#b7afa0',
  gold: '#c9a961',
  goldDeep: '#9d7c34',
  line: 'rgba(201,169,97,0.30)'
};

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}

function formatIDR(n: number): string {
  return 'IDR ' + n.toLocaleString('id-ID');
}

/** Compact stamp for WhatsApp / internal use, e.g. "12/06/2026 14:00 WITA". */
function formatWitaTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]} WITA`;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

/** Warm, readable stamp for emails, e.g. "Thursday, 12 June 2026 at 14:00". */
function prettyWhen(iso: string, lang: 'en' | 'id'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d, h, mi] = m;
  const dow = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
  const days = lang === 'id' ? DAYS_ID : DAYS_EN;
  const months = lang === 'id' ? MONTHS_ID : MONTHS_EN;
  const at = lang === 'id' ? 'pukul' : 'at';
  return `${days[dow]}, ${+d} ${months[+mo - 1]} ${y} ${at} ${h}:${mi}`;
}

function serviceLines(ctx: NotifyContext): { name: string; price: number; from: boolean }[] {
  return [ctx.baseService, ...ctx.addons].map((s) => ({
    name: s.name_en,
    price: s.price_idr,
    from: !!s.price_from_only
  }));
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

/* ═══════════════════════════ Owner alert ═══════════════════════════ */

function ownerWaReply(booking: Booking): string {
  const phone = booking.whatsapp_phone.replace(/[^0-9]/g, '');
  const text =
    booking.language === 'id'
      ? `Halo ${booking.customer_name}, kami konfirmasi booking Anda di Balis Barber pada ${formatWitaTime(booking.starts_at)}. Sampai jumpa!`
      : `Hi ${booking.customer_name}, confirming your Balis Barber booking on ${formatWitaTime(booking.starts_at)}. See you then.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildOwnerText(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const services = serviceLines(ctx)
    .map((s) => `  ${s.name}${s.from ? ' (from)' : ''}: ${formatIDR(s.price)}`)
    .join('\n');
  return [
    `New booking #${booking.id}`,
    '',
    `Name: ${booking.customer_name}`,
    `WhatsApp: ${booking.whatsapp_phone}`,
    booking.email ? `Email: ${booking.email}` : '',
    `When: ${prettyWhen(booking.starts_at, 'en')} (${booking.duration_min_total} min)`,
    `Barber: ${barber ? barber.name : 'Any available'}`,
    booking.address ? `Address: ${booking.address}` : '',
    '',
    'Services:',
    services,
    '',
    `Total: ${formatIDR(booking.price_idr_total)}`,
    '',
    `Reply on WhatsApp: ${ownerWaReply(booking)}`
  ]
    .filter(Boolean)
    .join('\n');
}

function buildOwnerHtml(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const rows = serviceLines(ctx)
    .map(
      (s) =>
        `<tr><td style="padding:4px 0;font-size:14px;color:${C.ink};">${esc(s.name)}${s.from ? ` <span style="color:${C.faint};">(from)</span>` : ''}</td><td align="right" style="padding:4px 0;font-size:14px;color:${C.ink};white-space:nowrap;">${formatIDR(s.price)}</td></tr>`
    )
    .join('');
  const line = (label: string, value: string) =>
    `<tr><td style="padding:3px 0;font-size:13px;color:${C.faint};width:96px;">${label}</td><td style="padding:3px 0;font-size:14px;color:${C.ink};font-weight:600;">${value}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};"><tr><td align="center" style="padding:24px 14px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.ivory};border:1px solid ${C.line};border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
  <tr><td style="background:${C.charcoal};padding:18px 24px;">
    <span style="font-size:16px;font-weight:700;letter-spacing:2px;color:${C.bone};">BALIS<span style="color:${C.gold};">.</span>BARBER</span>
    <span style="float:right;font-size:12px;letter-spacing:1px;color:${C.boneDim};text-transform:uppercase;padding-top:3px;">New booking</span>
  </td></tr>
  <tr><td style="padding:24px 24px 8px;">
    <h1 style="margin:0 0 16px;font-size:20px;color:${C.ink};font-weight:700;">Booking #${booking.id}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${line('Name', esc(booking.customer_name))}
      ${line('WhatsApp', esc(booking.whatsapp_phone))}
      ${booking.email ? line('Email', esc(booking.email)) : ''}
      ${line('When', esc(prettyWhen(booking.starts_at, 'en')))}
      ${line('Barber', esc(barber ? barber.name : 'Any available'))}
      ${booking.address ? line('Address', esc(booking.address)) : ''}
    </table>
  </td></tr>
  <tr><td style="padding:8px 24px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:12px;"><tr><td style="padding:14px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
      <tr><td style="padding-top:10px;border-top:1px solid ${C.line};font-size:14px;color:${C.ink};font-weight:700;">Total</td><td align="right" style="padding-top:10px;border-top:1px solid ${C.line};font-size:16px;color:${C.ink};font-weight:700;white-space:nowrap;">${formatIDR(booking.price_idr_total)}</td></tr></table>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:22px 24px 28px;" align="center">
    <a href="${ownerWaReply(booking)}" style="display:inline-block;background:#25955a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px;">Message ${esc(firstName(booking.customer_name))} on WhatsApp</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function sendOwnerEmail(ctx: NotifyContext): Promise<void> {
  const { env } = ctx;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.EMAIL_TO_OWNER) {
    console.warn('[notify] owner email skipped - env not configured');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM.trim(),
      to: env.EMAIL_TO_OWNER.trim(),
      subject: `New booking #${ctx.booking.id}: ${ctx.booking.customer_name}`,
      text: buildOwnerText(ctx),
      html: buildOwnerHtml(ctx)
    })
  });
  if (!res.ok) console.error('[notify] owner email failed', res.status, await res.text());
}

async function sendOwnerWhatsApp(ctx: NotifyContext): Promise<void> {
  const { env, booking, barber } = ctx;
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_OWNER_NUMBER) {
    console.warn('[notify] owner whatsapp skipped - env not configured');
    return;
  }
  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID.trim()}/messages`;
  const to = env.WHATSAPP_OWNER_NUMBER.trim();
  const payload = env.WHATSAPP_TEMPLATE_NAME
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: env.WHATSAPP_TEMPLATE_NAME.trim(),
          language: { code: (env.WHATSAPP_TEMPLATE_LANG ?? 'en').trim() },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: booking.customer_name },
                { type: 'text', text: formatWitaTime(booking.starts_at) },
                { type: 'text', text: barber ? barber.name : 'Any' }
              ]
            }
          ]
        }
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: buildOwnerText(ctx) }
      };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) console.error('[notify] owner whatsapp failed', res.status, await res.text());
}

export async function notifyOwner(ctx: NotifyContext): Promise<void> {
  await Promise.allSettled([sendOwnerEmail(ctx), sendOwnerWhatsApp(ctx)]);
}

/* ═══════════════════════ Customer confirmation ═══════════════════════ */

function customerCopy(lang: 'en' | 'id') {
  return lang === 'id'
    ? {
        subject: 'Booking Anda di Balis Barber',
        eyebrow: 'Booking diterima',
        title: (n: string) => `Terima kasih, ${n}`,
        intro:
          'Kami telah menerima permintaan booking Anda dan akan menghubungi Anda lewat WhatsApp untuk konfirmasi. Berikut detail Anda.',
        appointment: 'Jadwal',
        barber: 'Barber',
        any: 'Barber mana saja',
        total: 'Total',
        next: 'Kami akan mengonfirmasi jadwal Anda lewat WhatsApp sebentar lagi. Jika perlu mengubah sesuatu, balas pesan tersebut atau hubungi kami.',
        location: 'Lokasi',
        directions: 'Petunjuk arah',
        foot: 'Sampai jumpa di Balis Barber.',
        ref: 'Referensi'
      }
    : {
        subject: 'Your booking at Balis Barber',
        eyebrow: 'Booking received',
        title: (n: string) => `Thank you, ${n}`,
        intro:
          'We have your booking request and will message you on WhatsApp shortly to confirm. Here are your details.',
        appointment: 'Appointment',
        barber: 'Barber',
        any: 'Any available barber',
        total: 'Total',
        next: 'We will confirm your appointment on WhatsApp very soon. If you need to change anything, just reply to that message or contact us.',
        location: 'Find us',
        directions: 'Get directions',
        foot: 'We look forward to seeing you at Balis Barber.',
        ref: 'Reference'
      };
}

function buildCustomerText(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const t = customerCopy(booking.language);
  const services = serviceLines(ctx)
    .map((s) => `  ${s.name}: ${s.from ? 'from ' : ''}${formatIDR(s.price)}`)
    .join('\n');
  return [
    t.title(firstName(booking.customer_name)) + ',',
    '',
    t.intro,
    '',
    `${t.appointment}: ${prettyWhen(booking.starts_at, booking.language)}`,
    `${t.barber}: ${barber ? barber.name : t.any}`,
    '',
    services,
    `${t.total}: ${formatIDR(booking.price_idr_total)}`,
    '',
    `${t.location}: ${SHOP_ADDRESS}`,
    `${t.directions}: ${MAPS_DIRECTIONS}`,
    '',
    t.next,
    '',
    t.foot,
    `${t.ref}: #${booking.id}`
  ].join('\n');
}

function buildCustomerHtml(ctx: NotifyContext): string {
  const { booking, barber } = ctx;
  const t = customerCopy(booking.language);
  const rows = serviceLines(ctx)
    .map(
      (s) =>
        `<tr><td style="padding:5px 0;font-size:14px;color:${C.ink};">${esc(s.name)}${s.from ? ` <span style="color:${C.faint};">(from)</span>` : ''}</td><td align="right" style="padding:5px 0;font-size:14px;color:${C.ink};white-space:nowrap;">${formatIDR(s.price)}</td></tr>`
    )
    .join('');
  return `<!doctype html><html lang="${booking.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.ivory};border:1px solid ${C.line};border-radius:18px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">

  <tr><td style="background:${C.charcoal};padding:30px 28px;text-align:center;">
    <div style="font-size:24px;font-weight:700;letter-spacing:3px;color:${C.bone};">BALIS<span style="color:${C.gold};">.</span>BARBER</div>
    <div style="font-size:11px;letter-spacing:3px;color:${C.boneDim};text-transform:uppercase;margin-top:7px;">Sanur, Bali</div>
  </td></tr>

  <tr><td style="padding:32px 28px 6px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.goldDeep};font-weight:700;">${t.eyebrow}</p>
    <h1 style="margin:0 0 14px;font-size:27px;line-height:1.2;color:${C.ink};font-weight:700;">${esc(t.title(firstName(booking.customer_name)))}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${C.meta};">${t.intro}</p>
  </td></tr>

  <tr><td style="padding:0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:14px;"><tr><td style="padding:22px 24px;">
      <p style="margin:0 0 5px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};">${t.appointment}</p>
      <p style="margin:0 0 18px;font-size:19px;line-height:1.3;color:${C.ink};font-weight:700;">${esc(prettyWhen(booking.starts_at, booking.language))}</p>
      <p style="margin:0 0 5px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};">${t.barber}</p>
      <p style="margin:0 0 18px;font-size:16px;color:${C.ink};">${esc(barber ? barber.name : t.any)}</p>
      <div style="height:1px;background:${C.line};margin:0 0 12px;font-size:0;line-height:0;">&nbsp;</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      <div style="height:1px;background:${C.line};margin:12px 0;font-size:0;line-height:0;">&nbsp;</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:15px;color:${C.ink};font-weight:700;">${t.total}</td><td align="right" style="font-size:19px;color:${C.ink};font-weight:700;white-space:nowrap;">${formatIDR(booking.price_idr_total)}</td></tr></table>
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:24px 28px 0;">
    <p style="margin:0;font-size:14px;line-height:1.65;color:${C.meta};">${t.next}</p>
  </td></tr>

  <tr><td style="padding:24px 28px 4px;">
    <p style="margin:0 0 5px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};">${t.location}</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${C.ink};">${SHOP_ADDRESS}</p>
    <a href="${MAPS_DIRECTIONS}" style="display:inline-block;background:${C.gold};color:${C.ink};text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:999px;">${t.directions}</a>
  </td></tr>

  <tr><td style="padding:30px 28px;">
    <div style="height:1px;background:${C.line};margin:0 0 20px;font-size:0;line-height:0;">&nbsp;</div>
    <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:${C.meta};">${t.foot}</p>
    <p style="margin:0;font-size:13px;color:${C.meta};">WhatsApp <a href="https://wa.me/${SHOP_WA}" style="color:${C.goldDeep};text-decoration:none;font-weight:600;">${SHOP_WA_PRETTY}</a></p>
    <p style="margin:16px 0 0;font-size:11px;color:${C.faint};">${t.ref} #${booking.id}</p>
  </td></tr>

</table>
<p style="margin:16px 0 0;font-size:11px;color:${C.faint};font-family:Helvetica,Arial,sans-serif;">Balis Barber, Sanur, Bali</p>
</td></tr></table></body></html>`;
}

async function sendCustomerEmail(ctx: NotifyContext): Promise<void> {
  const { env, booking } = ctx;
  if (!booking.email) return;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn('[notify] customer email skipped - env not configured');
    return;
  }
  const t = customerCopy(booking.language);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM.trim(),
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

export async function sendBookingNotifications(ctx: NotifyContext): Promise<void> {
  await Promise.allSettled([notifyOwner(ctx), notifyCustomer(ctx)]);
}
