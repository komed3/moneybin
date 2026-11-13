import { ui } from '@/src/maintenance/utils/ui';
import { User } from '@/src/server/core/User';
import { Asset } from '@/src/server/model/Asset';
import { DailyValues } from '@/src/server/model/DailyValues';
import { Portfolio } from '@/src/server/model/Portfolio';
import { Stats } from '@/src/server/model/Stats';
import type { AssetRecord } from '@/src/shared/types/asset';
import { Command } from 'commander';


const forEachPortfolio = ( callback: ( portfolioId: string, userId: string ) => number ) : number => {
  const portfolios = new Set< string >();
  let count = 0;

  User.list().forEach( ( { id: userId } ) => {
    Portfolio.list( userId ).forEach( ( { id: portfolioId } ) => {
      if ( portfolios.has( portfolioId ) ) return;
      portfolios.add( portfolioId );

      count += callback( portfolioId, userId );
    } );
  } );

  return count;
};

const forEachAsset = ( callback: ( asset: AssetRecord, userId: string ) => void ) : number => {
  return forEachPortfolio( ( portfolioId, userId ) => {
    const assets = Asset.list( portfolioId, userId );
    assets.forEach( asset => callback( asset, userId ) );

    return assets.length;
  } );
}


export const registerDataCommands = ( program: Command ) : void => {
  const dataCommand = program
    .command( 'data' )
    .description( 'Manage financial data' );

  dataCommand
    .command( 'daily' )
    .description( 'Rebuild daily asset values' )
    .action( () => {
      const count = forEachAsset( ( asset, userId ) => DailyValues.recalculate( asset.id, userId, true ) );
      ui.success( `Updated daily values for ${ count } asset(s).` );
    } );

  dataCommand
    .command( 'assets' )
    .description( 'Rebuild yearly asset statistics' )
    .action( () => {
      const count = forEachAsset( ( asset, userId ) => Stats.recalculateAsset( asset, userId, true ) );
      ui.success( `Updated yearly statistics for ${ count } asset(s).` );
    } );

  dataCommand
    .command( 'portfolios' )
    .description( 'Rebuild yearly portfolio statistics' )
    .action( () => {
      const count = forEachPortfolio( ( portfolioId, userId ) => {
        Stats.recalculatePortfolio( portfolioId, userId );
        return 1;
      } );

      ui.success( `Updated yearly statistics for ${ count } portfolio(s).` );
    } );
};
