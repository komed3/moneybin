export interface ConfigSchema {
  APP_NAME: string;
  APP_DEFAULT_LANG: 'en' | 'de';

  NODE_ENV: 'dev' | 'development' | 'test' | 'prod' | 'production';
  ID_LENGTH: number;

  HOST: string;
  PORT: number;

  DB_PATH: string;
  DB_BUSY_TIMEOUT_MS: number;

  ASSET_QUALITY_DOCUMENTED: number;
  ASSET_QUALITY_RECONSTRUCTED: number;
  ASSET_QUALITY_SPECULATIVE: number;
  ASSET_QUALITY_ASSUMED: number;

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
  { type: 'string' | 'path' | 'enum', values?: readonly string[] }
);

export type ConfigTable = {
  [ K in ConfigName ]: ConfigDefinition< ConfigSchema[ K ] >
};
