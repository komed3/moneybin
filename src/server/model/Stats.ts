import { as, conn } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import type {
  StatsBookingCountRow, StatsDailyValue, StatsDailyValueRow,
  StatsPortfolioBookingCountRow, StatsPortfolioYearlyRow, StatsYearlyRow
} from '@/src/shared/types/stats';


export class Stats {
  private static calculate ( values: StatsDailyValue[], bookings: Map< number, number > ) : StatsYearlyRow[] {
    const years = new Map< number, StatsDailyValue[] >();

    values.forEach( value => {
      const year = Number( value.valueDate.slice( 0, 4 ) );
      const entries = years.get( year ) ?? [];

      entries.push( value );
      years.set( year, entries );
    } );

    return Array.from( years, ( [ year, entries ] ) => {
      const first = entries[ 0 ], last = entries[ entries.length - 1 ];
      const changes = entries.filter( value => value.change !== null );
      const percentages = entries.filter( value => value.changePercent !== null );
      const positive = changes.filter( value => value.change! > 0 );
      const negative = changes.filter( value => value.change! < 0 );
      const best = changes.reduce< StatsDailyValue | null >( ( r, v ) => ! r || v.change! > r.change! ? v : r, null );
      const worst = changes.reduce< StatsDailyValue | null >( ( r, v ) => ! r || v.change! < r.change! ? v : r, null );

      const mean = percentages.length
        ? percentages.reduce( ( sum, value ) => sum + value.changePercent!, 0 ) / percentages.length
        : null;

      const volatility = mean === null ? null : Math.sqrt(
        percentages.reduce( ( sum, value ) => sum + Math.pow( value.changePercent! - mean, 2 ), 0 ) /
        percentages.length
      );

      let peak = 0, maxDrawdown = 0, maxDrawdownPercent = 0;

      entries.forEach( value => {
        peak = Math.max( peak, value.close );

        const drawdown = peak - value.close;
        const drawdownPercent = peak === 0 ? 0 : drawdown / peak * 100;

        maxDrawdown = Math.max( maxDrawdown, drawdown );
        maxDrawdownPercent = Math.max( maxDrawdownPercent, drawdownPercent );
      } );

      const change = last.close - ( first.open ?? first.close );
      const open = first.open;
      const averageChange = changes.length
        ? changes.reduce( ( sum, value ) => sum + value.change!, 0 ) / changes.length
        : null;

      return {
        year, quality: entries.reduce( ( sum, value ) => sum + value.quality, 0 ) / entries.length,
        open, high: Math.max( ...entries.map( value => value.high ) ),
        low: Math.min( ...entries.map( value => value.low ) ), close: last.close,
        change, change_percent: open === null || open === 0 ? null : change / open * 100,
        average_value: entries.reduce( ( sum, value ) => sum + value.close, 0 ) / entries.length,
        volatility, max_drawdown: maxDrawdown, max_drawdown_percent: maxDrawdownPercent,
        booking_count: bookings.get( year ) ?? 0,
        positive_change: positive.reduce( ( sum, value ) => sum + value.change!, 0 ),
        negative_change: negative.reduce( ( sum, value ) => sum + value.change!, 0 ),
        average_change: averageChange, best_day: best?.change ?? null, worst_day: worst?.change ?? null,
        best_day_percent: best?.changePercent ?? null, worst_day_percent: worst?.changePercent ?? null
      };
    } ).sort( ( a, b ) => a.year - b.year );
  }

  private static getAssetValues ( assetId: string ) : StatsDailyValue[] {
    return as< StatsDailyValueRow[] >( conn().prepare( `
      SELECT asset_id, value_date, quality, open, high, low, close, change, change_percent
      FROM asset_daily_values
      WHERE asset_id = ?
      ORDER BY value_date
    ` ).all( assetId ) ).map( row => ( {
      valueDate: row.value_date, quality: row.quality, open: row.open, high: row.high, low: row.low,
      close: row.close, change: row.change, changePercent: row.change_percent
    } ) );
  }
}
