import type { Booking, Service, Barber } from './db';

type Env = App.Platform['env'];

interface NotifyContext {
  booking: Booking;
  baseService: Service;
  addons: Service[];
  barber: Barber | null;
  env: Env;
}

function formatIDR(n: number): string {
  return 'IDR ' + n.toLocaleString('id-ID');
}

function formatWitaTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]} WITA`;
}

function buildSummary(ctx: NotifyContext): string {
  const { booking, baseService, addons, barber } = ctx;
  const services = [baseService, ...addons]
    .map((s) => `- ${s.name_en}${s.price_from_only ? ' (from)' : ''}: ${formatIDR(s.price_idr)}`)
    .join('\n');
  return [
    `New booking #${booking.id}`,
    ``,
    `Name: ${booking.customer_name}`,
    `WhatsApp: ${booking.whatsapp_phone}`,
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

async function sendEmail(ctx: NotifyContext, body: string): Promise<void> {
  const { env } = ctx;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.EMAIL_TO_OWNER) {
    console.warn('[notify] email skipped — env vars not configured');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: env.EMAIL_TO_OWNER,
      subject: `New booking #${ctx.booking.id} — ${ctx.booking.customer_name}`,
      text: body
    })
  });
  if (!res.ok) {
    console.error('[notify] email send failed', res.status, await res.text());
  }
}

async function sendWhatsApp(ctx: NotifyContext, body: string): Promise<void> {
  const { env } = ctx;
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_OWNER_NUMBER) {
    console.warn('[notify] whatsapp skipped — env vars not configured');
    return;
  }
  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: env.WHATSAPP_OWNER_NUMBER,
      type: 'text',
      text: { body }
    })
  });
  if (!res.ok) {
    console.error('[notify] whatsapp send failed', res.status, await res.text());
  }
}

export async function notifyOwner(ctx: NotifyContext): Promise<void> {
  const body = buildSummary(ctx);
  await Promise.allSettled([sendEmail(ctx, body), sendWhatsApp(ctx, body)]);
}
