import type en from '@/src/client/locales/en';


export type Translations = typeof en.translation;

export type TranslationMap< T > = {
  [ K in keyof T ]: T[ K ] extends string ? string : TranslationMap< T[ K ] >
};

export type TranslationKey< T = Translations > = {
  [ K in keyof T & string ]: T[ K ] extends string ? K :
    T[ K ] extends object ? `${ K }.${ TranslationKey< T[ K ] > }` : never
}[ keyof T & string ];

export type TranslationValue< T, K extends string > =
  K extends `${ infer Head }.${ infer Rest }` ?
    Head extends keyof T ? TranslationValue< T[ Head ], Rest > : never :
    K extends keyof T ? T[ K ] : never;

export type TranslationFunction = {
  < K extends TranslationKey > ( key: K, ...args: unknown[] ): string;
} & TranslationMap< Translations >;
