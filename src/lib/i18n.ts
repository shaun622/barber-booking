import en from './i18n/en.json';
import id from './i18n/id.json';

export type Lang = 'en' | 'id';
export type Dict = typeof en;

export function dict(lang: Lang): Dict {
  return lang === 'id' ? (id as Dict) : (en as Dict);
}

export function serviceName(s: { name_en: string; name_id: string }, lang: Lang): string {
  return lang === 'id' ? s.name_id : s.name_en;
}

export function serviceDesc(
  s: { description_en: string | null; description_id: string | null },
  lang: Lang
): string {
  return (lang === 'id' ? s.description_id : s.description_en) ?? '';
}
