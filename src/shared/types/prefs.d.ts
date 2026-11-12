import type { CurrencyCode, LanguageCode } from '@/src/shared/types/values';


export interface UserPrefSchema {
  APP_LANGUAGE: LanguageCode;
  DEFAULT_CURRENCY: CurrencyCode;
}

export type UserPrefName = keyof UserPrefSchema;
export type UserPrefValue< K extends UserPrefName > = UserPrefSchema[ K ];

export type UserPrefDefinition< T > = {
  default: T;
  desc: string;
  validate?: ( value: unknown ) => T;
} & (
  [ T ] extends [ boolean ] ? { type: 'boolean' } :
  [ T ] extends [ number ] ? { type: 'number', min: number, max: number } :
  string extends T ? { type: 'string' } :
  { type: 'string', validate: ( value: unknown ) => T }
);

export type UserPrefTable = {
  [ K in UserPrefName ]: UserPrefDefinition< UserPrefSchema[ K ] >
};

export interface UserPrefRow {
  id: string;
  user_id: string;
  key: string;
  value: string | null;
}
