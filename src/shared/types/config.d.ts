import type { CurrencyCode, LanguageCode, NodeEnvironment } from '@/src/shared/types/values';


export interface ConfigSchema {
  APP_NAME: string;
  APP_DEFAULT_LANG: LanguageCode;
  APP_DEFAULT_CURRENCY: CurrencyCode;

  NODE_ENV: NodeEnvironment;
  ID_LENGTH: number;

  HOST: string;
  PORT: number;

  DB_PATH: string;
  DB_BUSY_TIMEOUT_MS: number;

  QUALITY_DOCUMENTED: number;
  QUALITY_RECONSTRUCTED: number;
  QUALITY_SPECULATIVE: number;
  QUALITY_ASSUMED: number;

  SESSION_LIFETIME_MS: number;
  PASSWORD_STRICT: boolean;
}

export type ConfigName = keyof ConfigSchema;
export type ConfigValue< K extends ConfigName > = ConfigSchema[ K ];

export type ConfigDefinition< T > = {
  default: T;
  desc: string;
} & (
  T extends number ? { type: 'integer', min: number, max: number } :
  T extends boolean ? { type: 'boolean' } :
  string extends T ? { type: 'string' | 'path', validate?: ( value: string ) => T } :
  { type: 'string', validate: ( value: string ) => T }
);

export type ConfigTable = {
  [ K in ConfigName ]: ConfigDefinition< ConfigSchema[ K ] >
};
