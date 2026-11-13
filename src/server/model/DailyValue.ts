import { Config } from '@/src/server/core/Config';
import { as, conn } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { parseDate } from '@/src/server/utils';
import type { BookingReliability } from '@/src/shared/types/values';
import type { BookingRow } from '@/src/shared/types/booking';
import type { DailyValueRecord, DailyValueRow } from '@/src/shared/types/daily';


const QUALITY = {
  documented: Config.get( 'QUALITY_DOCUMENTED' ) / 100,
  reconstructed: Config.get( 'QUALITY_RECONSTRUCTED' ) / 100,
  speculative: Config.get( 'QUALITY_SPECULATIVE' ) / 100,
  assumed: Config.get( 'QUALITY_ASSUMED' ) / 100
} as const satisfies Record< BookingReliability, number >;


export class DailyValues {
  private static toRecord ( row: DailyValueRow ) : DailyValueRecord {
    return {
      assetId: row.asset_id, valueDate: row.value_date, quality: row.quality,
      open: row.open, high: row.high, low: row.low, close: row.close,
      change: row.change, changePercent: row.change_percent
    };
  }
}
