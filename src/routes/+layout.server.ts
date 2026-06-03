import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, request, locals }) => {
  const cookieLang = cookies.get('lang');
  const headerLang = request.headers.get('accept-language')?.toLowerCase() ?? '';
  const lang: 'en' | 'id' =
    cookieLang === 'en' || cookieLang === 'id'
      ? cookieLang
      : headerLang.startsWith('id')
        ? 'id'
        : 'en';
  locals.lang = lang;
  return { lang };
};
