import { confirm, prompt, promptConfirmedPassword } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { Config } from '@/src/server/core/Config';
import { db } from '@/src/server/core/Database';
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

    if ( def.values ) details += `\nAllowed values: ${ def.values().join( ', ' ) }`;
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

const createFirstUser = async () : Promise< void > => {
  ui.nl();
  ui.headline( 'Initial user account', '[2/2]' );
  ui.nl();

  if ( ! await confirm( 'Create an initial user account?' ) ) {
    ui.info( 'No user account created. You can create one later using the user command.' );
    return;
  }

  let username = await prompt( 'Username:' );

  while ( true ) {
    try {
      username = User.validateUsername( username );
      if ( User.getByUsername( username ) ) throw new Error( 'Username is already taken' );
      break;
    } catch ( err ) {
      ui.error( err instanceof Error ? err.message : String( err ) );
      username = await prompt( 'Username:' );
    }
  }

  const pw = await promptConfirmedPassword( pw => User.validatePassword( pw ) );
  const user = await User.create( username, pw );

  ui.nl();
  ui.success( `Created user ${ user.username } (ID ${ user.id })` );
};


export const registerInitCommands = ( program: Command ) : void => {
  program
    .command( 'init' )
    .description( 'Initialize MoneyBin' )
    .action( async () => {
      if ( existsSync( resolve( '.env' ) ) )
        throw new Error( 'MoneyBin has already been initialized (.env already exists).' );

      ui.nl();
      console.log( ui.muted( '----------' ) );
      ui.nl();

      ui.info( ui.key( 'Welcome to MoneyBin' ) );
      ui.nl();

      ui.info( 'This command will guide you through the initial configuration of MoneyBin.' );
      ui.info( 'Press Enter to accept the displayed default value.' );
      ui.nl();

      await configure();

      db.open();
      await createFirstUser();

      ui.nl();
      ui.success( 'MoneyBin initialization complete.' );
      ui.info( `Run ${ ui.value( 'npm run start' ) } to start the server.` );
    } );
};
