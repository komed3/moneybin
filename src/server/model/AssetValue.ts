import { Config } from '@/src/server/core/Config';
import { as, conn } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { parseDate } from '@/src/server/utils';
import type { AssetValueRecord, AssetValueRow } from '@/src/shared/types/asset-value';
import type { BookingReliability, BookingRow } from '@/src/shared/types/booking';
import { Stats } from '@/src/server/model/Stats';


const QUALITY = {
  documented: Config.get( 'QUALITY_DOCUMENTED' ) / 100,
  reconstructed: Config.get( 'QUALITY_RECONSTRUCTED' ) / 100,
  speculative: Config.get( 'QUALITY_SPECULATIVE' ) / 100,
  assumed: Config.get( 'QUALITY_ASSUMED' ) / 100
} as const satisfies Record< BookingReliability, number >;


export class AssetValue {
  private static toRecord ( row: AssetValueRow ) : AssetValueRecord {
    return {
      assetId: row.asset_id, valueDate: row.value_date, quality: row.quality,
      open: row.open, high: row.high, low: row.low, close: row.close,
      change: row.change, changePercent: row.change_percent
    };
  }

  public static list ( assetId: string, userId: string ) : AssetValueRecord[] {
    Asset.getSafe( assetId, userId );

    return as< AssetValueRow[] >( conn().prepare(
      'SELECT * FROM asset_daily_values WHERE asset_id = ? ORDER BY value_date'
    ).all( assetId ) ).map( AssetValue.toRecord );
  }

  public static get ( assetId: string, userId: string, valueDate: string ) : AssetValueRecord {
    Asset.getSafe( assetId, userId );
    valueDate = parseDate( valueDate, 'Value date' );

    const row = as< AssetValueRow | null >( conn().prepare( `
      SELECT *
      FROM asset_daily_values
      WHERE asset_id = ? AND value_date <= ?
      ORDER BY value_date DESC
      LIMIT 1
    ` ).get( assetId, valueDate ) );

    const dailyValue = row ? AssetValue.toRecord( row ) : null;
    const exact = dailyValue?.valueDate === valueDate, close = dailyValue?.close ?? 0;

    return {
      assetId, valueDate, quality: dailyValue?.quality ?? 0, open: exact ? dailyValue.open : close,
      high: exact ? dailyValue.high : close, low: exact ? dailyValue.low : close, close,
      change: exact ? dailyValue.change : 0, changePercent: exact ? dailyValue.changePercent : 0
    };
  }

  public static delete ( assetId: string, userId: string ) : void {
    Asset.getSafe( assetId, userId );
    conn().exec( 'SAVEPOINT asset_value_deletion' );

    try {
      conn().prepare( 'DELETE FROM asset_daily_values WHERE asset_id = ?' ).run( assetId );
      Stats.recalculateAsset( assetId, userId );

      conn().exec( 'RELEASE SAVEPOINT asset_value_deletion' );
    } catch ( err ) {
      conn().exec( 'ROLLBACK TO SAVEPOINT asset_value_deletion' );
      conn().exec( 'RELEASE SAVEPOINT asset_value_deletion' );
      throw err;
    }
  }

  public static recalculate ( assetId: string, userId: string ) : void {
    Asset.getSafe( assetId, userId );

    const bookings = as< BookingRow[] >( conn().prepare( `
      SELECT * FROM bookings WHERE asset_id = ? ORDER BY value_date, rowid
    ` ).all( assetId ) );

    const database = conn();
    database.exec( 'SAVEPOINT asset_value_recalculation' );

    try {
      database.prepare( 'DELETE FROM asset_daily_values WHERE asset_id = ?' ).run( assetId );

      const insert = database.prepare( `
        INSERT INTO asset_daily_values (
          asset_id, value_date, quality, open, high, low, close, change, change_percent
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ` );

      let index = 0, value = 0, evidence = 0;

      while ( index < bookings.length ) {
        const valueDate = bookings[ index ].value_date, open = value;
        let high = open, low = open;

        while ( index < bookings.length && bookings[ index ].value_date === valueDate ) {
          const booking = bookings[ index++ ], quality = QUALITY[ booking.reliability ];

          if ( booking.value_type === 'absolute' ) value = booking.amount, evidence = booking.amount * quality;
          else value += booking.amount, evidence += booking.amount * quality;

          high = Math.max( high, value ), low = Math.min( low, value );
        }

        const change = value - open, changePercent = open === 0 ? null : change / open * 100;
        const quality = value === 0 ? 0 : Math.min( 1, Math.abs( evidence ) / Math.abs( value ) );

        insert.run( assetId, valueDate, quality, open, high, low, value, change, changePercent );
      }

      database.exec( 'RELEASE SAVEPOINT asset_value_recalculation' );
    } catch ( err ) {
      database.exec( 'ROLLBACK TO SAVEPOINT asset_value_recalculation' );
      database.exec( 'RELEASE SAVEPOINT asset_value_recalculation' );
      throw err;
    }
  }
}
