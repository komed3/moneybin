import type en from '@/src/client/locales/en';


export type TranslationMap< T > = {
  [ K in keyof T ]: T[ K ] extends string ? string : TranslationMap< T[ K ] >
};

export type TranslationTree = TranslationMap< typeof en.translation >;
