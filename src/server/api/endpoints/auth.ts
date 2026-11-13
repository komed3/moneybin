import { requireAuth } from '@/src/server/api/middleware';
import { Auth } from '@/src/server/core/Auth';
import { Config } from '@/src/server/core/Config';
import { User } from '@/src/server/core/User';
import { Router } from 'express';


export const auth = Router();


auth.get( '/env', ( _, res ) => res.json( {
  appName: Config.get( 'APP_NAME' ),
  defaultLanguage: Config.get( 'APP_DEFAULT_LANG' ),
  defaultCurrency: Config.get( 'APP_DEFAULT_CURRENCY' ),
  passwordStrict: Config.get( 'PASSWORD_STRICT' )
} ) );
