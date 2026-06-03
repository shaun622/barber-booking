import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/admin';

export const load: LayoutServerLoad = async ({ cookies, platform, url }) => {
  if (!platform) throw redirect(302, '/');
  if (url.pathname === '/admin/login') return {};
  const secret = platform.env.SESSION_SECRET;
  if (!secret) return {};
  const ok = await isAuthed(cookies, secret);
  if (!ok) throw redirect(302, '/admin/login');
  return {};
};
