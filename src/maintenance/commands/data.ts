import { ui } from '@/src/maintenance/utils/ui';
import { User } from '@/src/server/core/User';
import { Asset } from '@/src/server/model/Asset';
import { DailyValues } from '@/src/server/model/DailyValues';
import { Portfolio } from '@/src/server/model/Portfolio';
import { Stats } from '@/src/server/model/Stats';
import { Command } from 'commander';


export const registerDataCommands = ( program: Command ) : void => {
  const dataCommand = program
    .command( 'data' )
    .description( 'Manage financial data' );

  dataCommand
    .command( 'daily' )
    .description( 'Rebuild daily asset values' )
    .action( () => {
      const portfolios = new Set< string >();
      let count = 0;

      User.list().forEach( user => {
        Portfolio.list( user.id ).forEach( portfolio => {
          if ( portfolios.has( portfolio.id ) ) return;
          portfolios.add( portfolio.id );

          Asset.list( portfolio.id, user.id ).forEach( asset => {
            DailyValues.recalculate( asset.id, user.id, true );
            count++;
          } );
        } );
      } );

      ui.success( `Updated daily values for ${ count } asset(s).` );
    } );
}
