import de from '@/src/client/locales/de';
import en from '@/src/client/locales/en';
import type { TranslationTree } from '@/src/shared/types/i18n';
import type { LanguageCode } from '@/src/shared/types/values';


export function getTranslations ( language: LanguageCode ) : TranslationTree {
  return language === 'de' ? de.translation : en.translation;
}
