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
        name: key, value: Config.get( key ), default: def.default, type: def.type, description: def.desc,
        min: def.type === 'integer' ? def.min : '', max: def.type === 'integer' ? def.max : ''
      };
    } ) ) );

  configCommand
    .command( 'get <name>' )
    .description( 'Show a configuration value' )
    .action( ( name: string ) => {
      const key = Config.resolveName( name ), def = Config.schema[ key ];

      ui.info( def.desc );
      console.log( `${ ui.key( key ) }=${ ui.value( JSON.stringify( Config.get( key ) ) ) }` );
    } );
}
