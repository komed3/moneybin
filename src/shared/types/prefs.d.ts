export interface UserPrefSchema {
  APP_LANGUAGE: 'en' | 'de';
  DEFAULT_CURRENCY: string;
}

export type UserPrefName = keyof UserPrefSchema;
export type UserPrefValue< K extends UserPrefName > = UserPrefSchema[ K ];

export type UserPrefDefinition< T > = {
  default: T;
  desc: string;
} & (
  T extends boolean ? { type: 'boolean' } :
  T extends number ? { type: 'number', min: number, max: number } :
  { type: 'enum', values?: readonly string[] }
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
