import { as, conn } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import { toRecord, toRow } from '@/src/server/utils';
import type { AssetRecord } from '@/src/shared/types/asset';
import type { DailyValueRow } from '@/src/shared/types/daily';
import type {
  AssetYearlyRow, PortfolioYearlyRecord, PortfolioYearlyRow, StatsBookingRow,
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
const PORTFOLIO_RECORD_COLS = { ...YEARLY_COLS, assetCount: 'asset_count', activeAssetCount: 'active_asset_count' };

const PORTFOLIO_COLS = {
  portfolioId: 'portfolio_id', assetCount: 'asset_count',
  activeAssetCount: 'active_asset_count', ...YEARLY_COLS
};


export class Stats {
  private static toDailyValue ( row: DailyValueRow ) : StatsDailyValue {
    return {
      valueDate: row.value_date, quality: row.quality, open: row.open, high: row.high,
      low: row.low, close: row.close, change: row.change, changePercent: row.change_percent
    };
  }

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

  private static getAssetValues ( assetId: string ) : StatsDailyValue[] {
    return as< DailyValueRow[] >( conn().prepare(
      'SELECT * FROM asset_daily_values WHERE asset_id = ? ORDER BY value_date'
    ).all( assetId ) ).map( Stats.toDailyValue );
  }

  private static getAssetBookings ( assetId: string ) : Map< number, number > {
    const rows = as< StatsBookingRow[] >( conn().prepare( `
      SELECT CAST( substr( value_date, 1, 4 ) AS INTEGER ) AS year, COUNT(*) AS booking_count
      FROM bookings WHERE asset_id = ? GROUP BY year
    ` ).all( assetId ) );

    return new Map( rows.map( ( { year, booking_count } ) => [ year, booking_count ] ) );
  }

  private static getPortfolioValues ( portfolioId: string ) : StatsDailyValue[] {
    const assets = as< { id: string }[] >( conn().prepare(
      'SELECT id FROM assets WHERE portfolio_id = ?'
    ).all( portfolioId ) );

    const rows = as< DailyValueRow[] >( conn().prepare( `
      SELECT v.*
      FROM asset_daily_values v
      JOIN assets a ON a.id = v.asset_id
      WHERE a.portfolio_id = ?
      ORDER BY v.value_date, v.asset_id
    ` ).all( portfolioId ) );

    const dates = Array.from( new Set( rows.map( ( { value_date } ) => value_date ) ) );
    const updates = new Map< string, DailyValueRow[] >();

    rows.forEach( row => {
      const entries = updates.get( row.value_date ) ?? [];
      entries.push( row ), updates.set( row.value_date, entries );
    } );

    const latest = new Map< string, DailyValueRow >();

    return dates.map( valueDate => {
      updates.get( valueDate )?.forEach( row => latest.set( row.asset_id, row ) );

      let quality = 0, weight = 0, open = 0, high = -Infinity, low = Infinity, close = 0;

      assets.forEach( asset => {
        const value = latest.get( asset.id );
        if ( ! value ) return;

        const exact = value.value_date === valueDate;
        const assetOpen = exact ? value.open ?? value.close : value.close;
        const assetHigh = exact ? value.high : value.close;
        const assetLow = exact ? value.low : value.close;
        open += assetOpen, high += assetHigh, low += assetLow, close += value.close;

        const assetWeight = Math.abs( value.close );
        quality += value.quality * assetWeight, weight += assetWeight;
      } );

      const change = close - open;

      return {
        valueDate, quality: weight === 0 ? 0 : quality / weight, open, high, low,
        close, change, changePercent: open === 0 ? null : change / open * 100
      };
    } );
  }

  private static getPortfolioBookings ( portfolioId: string ) : Map< number, StatsBookingRow > {
    const rows = as< StatsBookingRow[] >( conn().prepare( `
      SELECT
        CAST( substr( b.value_date, 1, 4 ) AS INTEGER ) AS year,
        COUNT(*) AS booking_count,
        COUNT( DISTINCT b.asset_id ) AS active_asset_count
      FROM bookings b
      JOIN assets a ON a.id = b.asset_id
      WHERE a.portfolio_id = ?
      GROUP BY year
    ` ).all( portfolioId ) );

    return new Map( rows.map( row => [ row.year, row ] ) );
  }

  private static recalculateAssetData ( assetId: string ) : void {
    const stats = Stats.calculate( Stats.getAssetValues( assetId ), Stats.getAssetBookings( assetId ) );
    conn().prepare( 'DELETE FROM asset_yearly_stats WHERE asset_id = ?' ).run( assetId );

    const insert = conn().prepare( `
      INSERT INTO asset_yearly_stats (
        asset_id, year, quality, open, high, low, close, change, change_percent,
        average_value, volatility, max_drawdown, max_drawdown_percent,
        booking_count, positive_change, negative_change, average_change,
        best_day, worst_day, best_day_percent, worst_day_percent
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` );

    stats.forEach( row => {
      insert.run( ...Object.values( toRow( { assetId, ...row }, ASSET_COLS ) ) as SQLInputValue[] );
    } );
  }

  private static recalculatePortfolioData ( portfolioId: string ) : void {
    const bookings = Stats.getPortfolioBookings( portfolioId );
    const stats = Stats.calculate( Stats.getPortfolioValues( portfolioId ), new Map(
      Array.from( bookings, ( [ year, { booking_count } ] ) => [ year, booking_count ] )
    ) );

    const assetCount = as< { count: number } >( conn().prepare(
      'SELECT COUNT(*) AS count FROM assets WHERE portfolio_id = ?'
    ).get( portfolioId ) ).count;

    conn().prepare( 'DELETE FROM portfolio_yearly_stats WHERE portfolio_id = ?' ).run( portfolioId );

    const insert = conn().prepare( `
      INSERT INTO portfolio_yearly_stats (
        portfolio_id, year, quality, open, high, low, close, change, change_percent,
        average_value, volatility, max_drawdown, max_drawdown_percent,
        asset_count, active_asset_count, booking_count, positive_change, negative_change,
        average_change, best_day, worst_day, best_day_percent, worst_day_percent
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` );

    stats.forEach( row => {
      insert.run( ...Object.values( toRow( {
        portfolioId, assetCount, ...row, activeAssetCount: bookings.get( row.year )?.active_asset_count ?? 0
      }, PORTFOLIO_COLS ) ) as SQLInputValue[] );
    } );
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
      Stats.recalculateAssetData( asset.id );
      if ( ! holdPortfolioStats ) Stats.recalculatePortfolioData( asset.portfolioId );
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
      Stats.recalculatePortfolioData( portfolioId );
      conn().exec( 'RELEASE SAVEPOINT portfolio_stats_recalculation' );
    } catch ( err ) {
      conn().exec( 'ROLLBACK TO SAVEPOINT portfolio_stats_recalculation' );
      conn().exec( 'RELEASE SAVEPOINT portfolio_stats_recalculation' );
      throw err;
    }
  }
}
