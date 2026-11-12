import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { parseEnum, parseString } from '@/src/server/utils';
import type { UserPrefName, UserPrefRow, UserPrefSchema, UserPrefTable, UserPrefValue } from '@/src/shared/types/prefs';


export class UserPrefs {
  public static readonly schema = {
    APP_LANGUAGE: {
      type: 'enum', desc: 'Application language', default: Config.get( 'APP_DEFAULT_LANG' ),
      values: [ 'en', 'de' ]
    },
    DEFAULT_CURRENCY: {
      type: 'enum', desc: 'Default currency for new portfolios', default: Config.get( 'APP_DEFAULT_CURRENCY' ),
      values: [ 'EUR', 'USD', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'PLN' ]
    }
  } satisfies UserPrefTable;
}
