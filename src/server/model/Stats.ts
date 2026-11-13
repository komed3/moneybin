import { as, conn } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Booking } from '@/src/server/model/Booking';
import { DailyValues } from '@/src/server/model/DailyValues';
import { Portfolio } from '@/src/server/model/Portfolio';
import { toRecord, toRow } from '@/src/server/utils';
import type { AssetRecord } from '@/src/shared/types/asset';
import type { BookingRecord } from '@/src/shared/types/booking';
import type { DailyValueRecord } from '@/src/shared/types/daily';
import type {
  AssetYearlyRow, PortfolioYearlyRecord, PortfolioYearlyRow,
  StatsDailyValue, YearlyRecord
} from '@/src/shared/types/stats';
import type { SQLInputValue } from 'node:sqlite';


const YEARLY_COLS = {
  year: 'year', quality: 'quality', open: 'open', high: 'high', low: 'low', close: 'close',
  change: 'change', changePercent: 'change_percent', averageValue: 'average_value',
  volatility: 'volatility', maxDrawdown: 'max_drawdown', maxDrawdownPercent: 'max_drawdown_percent',
  bookingCount: 'booking_count', positiveChange: 'positive_change', negativeChange: 'negative_change',
  averageChange: 'average_change', bestDay: 'best_day', worstDay: 'worst_day',
  bestDayPercent: 'best_day_percent', worstDayPercent: 'worst_day_percent'
};

const ASSET_COLS = { assetId: 'asset_id', ...YEARLY_COLS };

const PORTFOLIO_COLS = {
  portfolioId: 'portfolio_id', assetCount: 'asset_count',
  activeAssetCount: 'active_asset_count', ...YEARLY_COLS
};

const PORTFOLIO_RECORD_COLS = {
  assetCount: 'asset_count', activeAssetCount: 'active_asset_count',
  ...YEARLY_COLS
};


export class Stats {
  private static calculate ( values: StatsDailyValue[], bookings: Map< number, number > ) : YearlyRecord[] {
    const years = new Map< number, StatsDailyValue[] >();

    values.forEach( value => {
      const year = Number( value.valueDate.slice( 0, 4 ) ), entries = years.get( year ) ?? [];
      entries.push( value ), years.set( year, entries );
    } );

    return Array.from( years, ( [ year, entries ] ) => {
      const first = entries[ 0 ], last = entries[ entries.length - 1 ];
      const changes = entries.filter( ( { change } ) => change !== null );
      const pcts = entries.filter( ( { changePercent } ) => changePercent !== null );
      const pos = changes.filter( ( { change } ) => change! > 0 ), neg = changes.filter( ( { change } ) => change! < 0 );
      const best = changes.reduce< StatsDailyValue | null >( ( r, v ) => ! r || v.change! > r.change! ? v : r, null );
      const worst = changes.reduce< StatsDailyValue | null >( ( r, v ) => ! r || v.change! < r.change! ? v : r, null );
      const mean = pcts.length ? pcts.reduce( ( sum, value ) => sum + value.changePercent!, 0 ) / pcts.length : null;

      const volatility = mean === null ? null : Math.sqrt( pcts.reduce(
        ( sum, value ) => sum + Math.pow( value.changePercent! - mean, 2 ), 0
      ) / pcts.length );

      let high = -Infinity, low = Infinity, quality = 0, average = 0;
      let peak = 0, maxDrawdown = 0, maxDrawdownPercent = 0;

      entries.forEach( value => {
        high = Math.max( high, value.high ), low = Math.min( low, value.low );
        quality += value.quality, average += value.close, peak = Math.max( peak, value.close );

        const drawdown = peak - value.close;
        maxDrawdown = Math.max( maxDrawdown, drawdown );
        maxDrawdownPercent = Math.max( maxDrawdownPercent, peak === 0 ? 0 : drawdown / peak * 100 );
      } );

      const open = first.open, change = last.close - ( open ?? first.close );

      return {
        year, quality: quality / entries.length, open, high, low, close: last.close,
        change, changePercent: open === null || open === 0 ? null : change / open * 100,
        averageValue: average / entries.length, volatility, maxDrawdown, maxDrawdownPercent,
        bookingCount: bookings.get( year ) ?? 0,
        positiveChange: pos.reduce( ( sum, { change } ) => sum + change!, 0 ),
        negativeChange: neg.reduce( ( sum, { change } ) => sum + change!, 0 ),
        averageChange: changes.length ? changes.reduce( ( sum, { change } ) => sum + change!, 0 ) / changes.length : null,
        bestDay: best?.change ?? null, worstDay: worst?.change ?? null,
        bestDayPercent: best?.changePercent ?? null, worstDayPercent: worst?.changePercent ?? null
      };
    } ).sort( ( a, b ) => a.year - b.year );
  }

  private static getBookingCounts ( bookings: BookingRecord[] ) : Map< number, number > {
    const counts = new Map< number, number >();

    bookings.forEach( ( { valueDate } ) => {
      const year = Number( valueDate.slice( 0, 4 ) );
      counts.set( year, ( counts.get( year ) ?? 0 ) + 1 );
    } );

    return counts;
  }

  private static getPortfolioValues ( assets: AssetRecord[], userId: string ) : StatsDailyValue[] {
    const updates = new Map< string, Map< string, DailyValueRecord > >();

    assets.forEach( ( { id } ) => {
      DailyValues.list( id, userId ).forEach( value => {
        const entries = updates.get( value.valueDate ) ?? new Map< string, DailyValueRecord >();
        entries.set( id, value ), updates.set( value.valueDate, entries );
      } );
    } );

    const dates = Array.from( updates.keys() ).sort();
    const latest = new Map< string, DailyValueRecord >();

    return dates.map( valueDate => {
      updates.get( valueDate )?.forEach( ( value, assetId ) => latest.set( assetId, value ) );
      let quality = 0, weight = 0, open = 0, high = -Infinity, low = Infinity, close = 0;

      latest.forEach( value => {
        const exact = value.valueDate === valueDate;
        const assetOpen = exact ? value.open ?? value.close : value.close;
        const assetHigh = exact ? value.high : value.close;
        const assetLow = exact ? value.low : value.close;
        const assetWeight = Math.abs( value.close );

        open += assetOpen, high = Math.max( high, assetHigh ), low = Math.min( low, assetLow );
        close += value.close, quality += value.quality * assetWeight, weight += assetWeight;
      } );

      const change = close - open;

      return {
        valueDate, quality: weight === 0 ? 0 : quality / weight, open, high, low,
        close, change, changePercent: open === 0 ? null : change / open * 100
      };
    } );
  }

  private static recalculateAssetData ( { id }: AssetRecord, userId: string ) : void {
    const stats = Stats.calculate( DailyValues.list( id, userId ), Stats.getBookingCounts( Booking.list( id, userId ) ) );
    conn().prepare( 'DELETE FROM asset_yearly_stats WHERE asset_id = ?' ).run( id );

    const insert = conn().prepare( `
      INSERT INTO asset_yearly_stats (
        asset_id, year, quality, open, high, low, close, change, change_percent,
        average_value, volatility, max_drawdown, max_drawdown_percent,
        booking_count, positive_change, negative_change, average_change,
        best_day, worst_day, best_day_percent, worst_day_percent
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` );

    stats.forEach( r => insert.run( ...Object.values( toRow( { assetId: id, ...r }, ASSET_COLS ) ) as SQLInputValue[] ) );
  }

  private static recalculatePortfolioData ( portfolioId: string, userId: string ) : void {
    const assets = Asset.list( portfolioId, userId ), bookings = Booking.listByPortfolio( portfolioId, userId );
    const activeAssets = new Map< number, Set< string > >();

    bookings.forEach( ( { assetId, valueDate } ) => {
      const year = Number( valueDate.slice( 0, 4 ) ), entries = activeAssets.get( year ) ?? new Set< string >();
      entries.add( assetId ), activeAssets.set( year, entries );
    } );

    const stats = Stats.calculate( Stats.getPortfolioValues( assets, userId ), Stats.getBookingCounts( bookings ) );
    conn().prepare( 'DELETE FROM portfolio_yearly_stats WHERE portfolio_id = ?' ).run( portfolioId );

    const insert = conn().prepare( `
      INSERT INTO portfolio_yearly_stats (
        portfolio_id, year, quality, open, high, low, close, change, change_percent,
        average_value, volatility, max_drawdown, max_drawdown_percent,
        asset_count, active_asset_count, booking_count, positive_change, negative_change,
        average_change, best_day, worst_day, best_day_percent, worst_day_percent
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` );

    stats.forEach( r => insert.run( ...Object.values( toRow( {
      portfolioId, assetCount: assets.length, activeAssetCount: activeAssets.get( r.year )?.size ?? 0, ...r
    }, PORTFOLIO_COLS ) ) as SQLInputValue[] ) );
  }

  public static listAsset ( assetId: string, userId: string ) : YearlyRecord[] {
    Asset.getSafe( assetId, userId );

    return as< AssetYearlyRow[] >( conn().prepare(
      'SELECT * FROM asset_yearly_stats WHERE asset_id = ? ORDER BY year'
    ).all( assetId ) ).map( row => toRecord< YearlyRecord >( row, YEARLY_COLS ) );
  }

  public static getAssetYear ( assetId: string, year: number, userId: string ) : YearlyRecord | null {
    Asset.getSafe( assetId, userId );

    const row = as< AssetYearlyRow | undefined >( conn().prepare(
      'SELECT * FROM asset_yearly_stats WHERE asset_id = ? AND year = ?'
    ).get( assetId, year ) );

    return row ? toRecord< YearlyRecord >( row, YEARLY_COLS ) : null;
  }

  public static listPortfolio ( portfolioId: string, userId: string ) : PortfolioYearlyRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< PortfolioYearlyRow[] >( conn().prepare(
      'SELECT * FROM portfolio_yearly_stats WHERE portfolio_id = ? ORDER BY year'
    ).all( portfolioId ) ).map( row => toRecord< PortfolioYearlyRecord >( row, PORTFOLIO_RECORD_COLS ) );
  }

  public static getPortfolioYear ( portfolioId: string, year: number, userId: string ) : PortfolioYearlyRecord | null {
    Portfolio.assertMember( portfolioId, userId );

    const row = as< PortfolioYearlyRow | undefined >( conn().prepare(
      'SELECT * FROM portfolio_yearly_stats WHERE portfolio_id = ? AND year = ?'
    ).get( portfolioId, year ) );

    return row ? toRecord< PortfolioYearlyRecord >( row, PORTFOLIO_RECORD_COLS ) : null;
  }

  public static recalculateAsset ( asset: AssetRecord, userId: string, holdPortfolioStats = false ) : void {
    Portfolio.assertMember( asset.portfolioId, userId );
    conn().exec( 'SAVEPOINT asset_stats_recalculation' );

    try {
      Stats.recalculateAssetData( asset, userId );
      if ( ! holdPortfolioStats ) Stats.recalculatePortfolioData( asset.portfolioId, userId );
      conn().exec( 'RELEASE SAVEPOINT asset_stats_recalculation' );
    } catch ( err ) {
      conn().exec( 'ROLLBACK TO SAVEPOINT asset_stats_recalculation' );
      conn().exec( 'RELEASE SAVEPOINT asset_stats_recalculation' );
      throw err;
    }
  }

  public static recalculatePortfolio ( portfolioId: string, userId: string ) : void {
    Portfolio.assertMember( portfolioId, userId );
    conn().exec( 'SAVEPOINT portfolio_stats_recalculation' );

    try {
      Stats.recalculatePortfolioData( portfolioId, userId );
      conn().exec( 'RELEASE SAVEPOINT portfolio_stats_recalculation' );
    } catch ( err ) {
      conn().exec( 'ROLLBACK TO SAVEPOINT portfolio_stats_recalculation' );
      conn().exec( 'RELEASE SAVEPOINT portfolio_stats_recalculation' );
      throw err;
    }
  }
}
