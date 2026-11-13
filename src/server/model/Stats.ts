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
}
