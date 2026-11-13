import { as, conn } from '@/src/server/core/Database';
import { Portfolio } from '@/src/server/model/Portfolio';
import type { AssetRecord } from '@/src/shared/types/asset';
import type { DailyValueRow } from '@/src/shared/types/daily';
import type { StatsBookingRow, StatsDailyValue, StatsYearlyRow } from '@/src/shared/types/stats';


export class Stats {
  private static toDailyValue ( row: DailyValueRow ) : StatsDailyValue {
    return {
      valueDate: row.value_date, quality: row.quality, open: row.open, high: row.high,
      low: row.low, close: row.close, change: row.change, changePercent: row.change_percent
    };
  }

  private static calculate ( values: StatsDailyValue[], bookings: Map< number, number > ) : StatsYearlyRow[] {
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
        change, change_percent: open === null || open === 0 ? null : change / open * 100,
        average_value: average / entries.length, volatility, max_drawdown: maxDrawdown,
        max_drawdown_percent: maxDrawdownPercent, booking_count: bookings.get( year ) ?? 0,
        positive_change: pos.reduce( ( sum, { change } ) => sum + change!, 0 ),
        negative_change: neg.reduce( ( sum, { change } ) => sum + change!, 0 ),
        average_change: changes.length ? changes.reduce( ( sum, { change } ) => sum + change!, 0 ) / changes.length : null,
        best_day: best?.change ?? null, worst_day: worst?.change ?? null,
        best_day_percent: best?.changePercent ?? null, worst_day_percent: worst?.changePercent ?? null
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

    const rows = as< ( DailyValueRow & { asset_id: string } )[] >( conn().prepare( `
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

      let quality = 0, weight = 0, open = 0, high = 0, low = 0, close = 0;

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

    stats.forEach( v => insert.run(
      assetId, v.year, v.quality, v.open, v.high, v.low, v.close, v.change, v.change_percent,
      v.average_value, v.volatility, v.max_drawdown, v.max_drawdown_percent, v.booking_count,
      v.positive_change, v.negative_change, v.average_change, v.best_day, v.worst_day,
      v.best_day_percent, v.worst_day_percent
    ) );
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

    stats.forEach( v => insert.run(
      portfolioId, v.year, v.quality, v.open, v.high, v.low, v.close, v.change, v.change_percent,
      v.average_value, v.volatility, v.max_drawdown, v.max_drawdown_percent, assetCount,
      bookings.get( v.year )?.active_asset_count ?? 0, v.booking_count, v.positive_change,
      v.negative_change, v.average_change, v.best_day, v.worst_day, v.best_day_percent, v.worst_day_percent
    ) );
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
