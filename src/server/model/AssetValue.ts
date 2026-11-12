import { Config } from '@/src/server/core/Config';
import { as, conn } from '@/src/server/core/Database';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseDate } from '@/src/server/utils';
import type { AssetValueRecord, AssetValueRow } from '@/src/shared/types/asset-value';
import type { BookingReliability, BookingRow } from '@/src/shared/types/booking';


const QUALITY = {
  documented: Config.get( 'QUALITY_DOCUMENTED' ) / 100,
  reconstructed: Config.get( 'QUALITY_RECONSTRUCTED' ) / 100,
  speculative: Config.get( 'QUALITY_SPECULATIVE' ) / 100,
  assumed: Config.get( 'QUALITY_ASSUMED' ) / 100
} as const satisfies Record< BookingReliability, number >;


export class AssetValue {
  private static getPortfolioId ( assetId: string ) : string {
    assertId( assetId, 'asset' );

    const row = as< { portfolio_id: string } | null >( conn().prepare(
      'SELECT portfolio_id FROM assets WHERE id = ?'
    ).get( assetId ) );

    if ( ! row ) throw new Error( `Asset ${ assetId } does not exist` );
    return row.portfolio_id;
  }

  private static toRecord ( row: AssetValueRow ) : AssetValueRecord {
    return {
      assetId: row.asset_id, valueDate: row.value_date, quality: row.quality,
      open: row.open, high: row.high, low: row.low, close: row.close,
      change: row.change, changePercent: row.change_percent
    };
  }

  public static list ( assetId: string, userId: string ) : AssetValueRecord[] {
    Portfolio.assertMember( AssetValue.getPortfolioId( assetId ), userId );

    return as< AssetValueRow[] >( conn().prepare(
      'SELECT * FROM asset_daily_values WHERE asset_id = ? ORDER BY value_date'
    ).all( assetId ) ).map( AssetValue.toRecord );
  }

  public static get ( assetId: string, valueDate: string, userId: string ) : AssetValueRecord | null {
    valueDate = parseDate( valueDate, 'Value date' );
    Portfolio.assertMember( AssetValue.getPortfolioId( assetId ), userId );

    const row = as< AssetValueRow | null >( conn().prepare(
      'SELECT * FROM asset_daily_values WHERE asset_id = ? AND value_date = ?'
    ).get( assetId, valueDate ) );

    return row ? AssetValue.toRecord( row ) : null;
  }

  public static delete ( assetId: string, userId: string ) : void {
    Portfolio.assertEditable( AssetValue.getPortfolioId( assetId ), userId );
    conn().prepare( 'DELETE FROM asset_daily_values WHERE asset_id = ?' ).run( assetId );
  }
}
