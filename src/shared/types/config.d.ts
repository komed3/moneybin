export interface ConfigSchema {
  APP_NAME: string;
  APP_DEFAULT_LANG: 'en' | 'de';
  APP_DEFAULT_CURRENCY: 'EUR';

  NODE_ENV: 'dev' | 'development' | 'test' | 'prod' | 'production';
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
