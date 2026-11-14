import de from '@/src/client/locales/de';
import en from '@/src/client/locales/en';
import type { TranslationFunction, TranslationMap } from '@/src/shared/types/i18n';
import type { LanguageCode } from '@/src/shared/types/values';


const resources = { en, de } as const;


export function createI18n ( language: LanguageCode ) : TranslationFunction {
  const translations: TranslationMap< typeof en.translation > = resources[ language ].translation;

  const translate = ( key: string, ...args: unknown[] ) => {
    const value = key.split( '.' ).reduce< unknown >( ( c, part ) =>
      ( c as Record< string, unknown > )?.[ part ], translations
    );

    return typeof value === 'string' ? value.replace( /\$(\d+)/g, ( _, index ) =>
      String( args[ Number( index ) - 1 ] ?? '' )
    ) : key;
  };

  return Object.assign( translate, translations ) as TranslationFunction;
}
