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

  public static list ( assetId: string, userId: string ) : DailyValueRecord[] {
    Asset.getSafe( assetId, userId );

    return as< DailyValueRow[] >( conn().prepare(
      'SELECT * FROM asset_daily_values WHERE asset_id = ? ORDER BY value_date'
    ).all( assetId ) ).map( DailyValues.toRecord );
  }

  public static get ( assetId: string, userId: string, valueDate: string ) : DailyValueRecord {
    Asset.getSafe( assetId, userId );
    valueDate = parseDate( valueDate, 'Value date' );

    const row = as< DailyValueRow | null >( conn().prepare( `
      SELECT *
      FROM asset_daily_values
      WHERE asset_id = ? AND value_date <= ?
      ORDER BY value_date DESC
      LIMIT 1
    ` ).get( assetId, valueDate ) );

    const dailyValue = row ? DailyValues.toRecord( row ) : null;
    if ( dailyValue?.valueDate === valueDate ) return dailyValue;

    const close = dailyValue?.close ?? 0;

    return {
      assetId, valueDate, quality: dailyValue?.quality ?? 0, open: close,
      high: close, low: close, close, change: 0, changePercent: 0
    };
  }

  public static delete ( assetId: string, userId: string ) : void {
    Asset.getSafe( assetId, userId );
    conn().prepare( 'DELETE FROM asset_daily_values WHERE asset_id = ?' ).run( assetId );
  }
}
