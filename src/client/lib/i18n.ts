import de from '@/src/client/locales/de';
import en from '@/src/client/locales/en';
import type { TranslationTree } from '@/src/shared/types/i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';


export const resources = { en, de } as const;


i18n
  .use( Backend )
  .use( LanguageDetector )
  .use( initReactI18next )
  .init( {
    resources, fallbackLng: 'en', lng: 'en', enableSelector: true,
    interpolation: { escapeValue: false }
  } );


const createTranslation = ( path = '' ) : TranslationTree => new Proxy( {}, {
  get: ( _, key ) => {
    if ( typeof key !== 'string' ) return undefined;

    const next = path ? `${ path }.${ key }` : key;
    const value = next.split( '.' ).reduce< unknown >( ( c, part ) =>
      ( c as Record< string, unknown > )?.[ part ], en.translation
    );

    return typeof value === 'string' ? i18n.t( next ) : value &&
      typeof value === 'object' ? createTranslation( next ) : undefined;
  }
} ) as TranslationTree;


export const t = createTranslation();
export default i18n;
