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
}
