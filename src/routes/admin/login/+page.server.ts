import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, isAuthed, setSession } from '$lib/admin';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) return {};
  const secret = platform.env.SESSION_SECRET;
  if (secret && (await isAuthed(cookies, secret))) throw redirect(302, '/admin');
  return { configured: !!(platform.env.ADMIN_PASSWORD_HASH && platform.env.SESSION_SECRET) };
};

export const actions: Actions = {
  default: async ({ request, cookies, platform }) => {
    if (!platform) return fail(500);
    const form = await request.formData();
    const pw = String(form.get('password') ?? '');
    const hash = platform.env.ADMIN_PASSWORD_HASH;
    const secret = platform.env.SESSION_SECRET;
    if (!hash || !secret) return fail(500, { error: 'not_configured' });
    const ok = await checkPassword(pw, hash);
    if (!ok) return fail(401, { error: 'invalid' });
    await setSession(cookies, secret);
    throw redirect(302, '/admin');
  }
};
