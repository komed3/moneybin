import { prompt, confirm, promptConfirmedPassword } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { Config } from '@/src/server/core/Config';
import { Database, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import type { ConfigName, ConfigValue } from '@/src/shared/types/config';
import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';


const configure = async () : Promise< void > => {
  ui.headline( 'Configure MoneyBin', '[1/2]' );

  for ( const key of Object.keys( Config.schema ) as ConfigName[] ) {
    const def = Config.schema[ key ], current = String( Config.get( key ) );
    let details = def.desc;

    if ( def.type === 'enum' && def.values ) details += `\nAllowed values: ${ def.values.join( ', ' ) }`;
    if ( def.type === 'integer' ) details += `\nRange: ${ def.min }–${ def.max }`;

    let saved = false;

    while ( ! saved ) {
      ui.info( `\n${ ui.key( key ) }\n${ details }` );
      const answer = await prompt( 'Value:', current );

      try {
        const value = Config.validate( key, answer );
        Config.set( key, value as ConfigValue< typeof key > );

        ui.success( `${ key } configured.` );
        saved = true;
      } catch ( err ) {
        ui.error( err instanceof Error ? err.message : String( err ) );
      }
    }
  }
};
