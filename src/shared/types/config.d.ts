export interface ConfigSchema {
  APP_NAME: string;
  NODE_ENV: 'dev' | 'development' | 'test' | 'prod' | 'production';
  ID_LENGTH: number;

  HOST: string;
  PORT: number;

  DB_PATH: string;
  DB_BUSY_TIMEOUT_MS: number;

  SESSION_LIFETIME_MS: number;
  PASSWORD_STRICT: boolean;
}
