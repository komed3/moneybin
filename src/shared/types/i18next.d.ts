import type en from '@/src/client/locales/en';
import 'i18next';


declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof en;
    enableSelector: true;
  }
}


export type TranslationMap< T > = {
  [ K in keyof T ]: T[ K ] extends string ? string : TranslationMap< T[ K ] >
};

export type TranslationTree = TranslationMap< typeof en.translation >;
