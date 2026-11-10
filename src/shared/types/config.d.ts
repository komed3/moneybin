export interface ConfigSchema {
  APP_NAME: string;
  APP_DEFAULT_LANG: 'en' | 'de';

  NODE_ENV: 'dev' | 'development' | 'test' | 'prod' | 'production';
  ID_LENGTH: number;

  HOST: string;
  PORT: number;

  DB_PATH: string;
  DB_BUSY_TIMEOUT_MS: number;

  SESSION_LIFETIME_MS: number;
  PASSWORD_STRICT: boolean;
}

export type ConfigName = keyof ConfigSchema;
export type ConfigValue< K extends ConfigName > = ConfigSchema[ K ];
