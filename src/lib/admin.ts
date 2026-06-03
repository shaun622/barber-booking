import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'admin';
const MAX_AGE = 60 * 60 * 8; // 8h

async function hmac(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  const b = new Uint8Array(sig);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

export async function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function setSession(cookies: Cookies, secret: string): Promise<void> {
  const issued = Date.now().toString();
  const sig = await hmac(secret, issued);
  cookies.set(COOKIE, `${issued}.${sig}`, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE
  });
}

export async function isAuthed(cookies: Cookies, secret: string): Promise<boolean> {
  const v = cookies.get(COOKIE);
  if (!v) return false;
  const [issued, sig] = v.split('.');
  if (!issued || !sig) return false;
  const ageMs = Date.now() - parseInt(issued, 10);
  if (!Number.isFinite(ageMs) || ageMs > MAX_AGE * 1000 || ageMs < 0) return false;
  const expected = await hmac(secret, issued);
  return timingSafeEqual(sig, expected);
}

export function clearSession(cookies: Cookies): void {
  cookies.delete(COOKIE, { path: '/' });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
