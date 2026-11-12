import { ui } from '@/src/maintenance/utils/ui';
import { Config } from '@/src/server/core/Config';
import { Command } from 'commander';


export const registerConfigCommands = ( program: Command ) : void => {
  const configCommand = program
    .command( 'config' )
    .description( 'Manage environment configuration' );

  configCommand
    .command( 'list' )
    .description( 'List configuration values' )
    .action( () => console.table( Object.keys( Config.schema ).map( name => {
      const key = Config.resolveName( name ), def = Config.schema[ key ];

      return {
        name: key, value: Config.get( key ), default: def.default, type: def.type,
        values: def.values?.().join( ', ' ) ?? '', description: def.desc,
        min: def.type === 'integer' ? def.min : '', max: def.type === 'integer' ? def.max : ''
      };
    } ) ) );

  configCommand
    .command( 'get <name>' )
    .description( 'Show a configuration value' )
    .action( ( name: string ) => {
      const key = Config.resolveName( name ), def = Config.schema[ key ];

      ui.info( def.desc );
      if ( def.values ) ui.info( `Allowed values: ${ def.values().join( ', ' ) }` );

      console.log( `${ ui.key( key ) }=${ ui.value( JSON.stringify( Config.get( key ) ) ) }` );
    } );

  configCommand
    .command( 'set <name> <value>' )
    .description( 'Set a configuration value' )
    .action( ( name: string, value: string ) => {
      const key = Config.resolveName( name ), updated = Config.set( key, Config.validate( key, value ) );

      ui.success( `Updated ${ key }=${ JSON.stringify( updated ) }` );
      ui.warning( 'Restart MoneyBin for changes to take effect.' );
    } );

  configCommand
    .command( 'unset <name>' )
    .description( 'Restore the default value' )
    .action( ( name: string ) => {
      const key = Config.resolveName( name );
      Config.reset( key );

      ui.success( `Reset ${ key } to ${ JSON.stringify( Config.get( key ) ) }` );
      ui.warning( 'Restart MoneyBin for changes to take effect.' );
    } );
};
