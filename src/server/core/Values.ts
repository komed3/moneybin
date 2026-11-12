import { as, conn } from '@/src/server/core/Database';
import { parseEnum, parseString } from '@/src/server/utils';
import type { AssetLiquidationLevel, AssetStatus, AssetType } from '@/src/shared/types/asset';
import type { BookingReliability, BookingType, BookingValueType } from '@/src/shared/types/booking';
import type { CurrencyRecord, CurrencyRow } from '@/src/shared/types/values';
import type { PersonGender } from '@/src/shared/types/person';
import type { PortfolioMemberRole } from '@/src/shared/types/portfolio';


export class Values {
  private static readonly ASSET_STATUSES = [ 'real', 'fictional' ] as const;
  private static readonly BOOKING_VALUE_TYPES = [ 'relative', 'absolute' ] as const;
  private static readonly BOOKING_RELIABILITIES = [ 'documented', 'reconstructed', 'speculative', 'assumed' ] as const;
  private static readonly PERSON_GENDERS = [ 'male', 'female', 'diverse' ] as const;
  private static readonly PORTFOLIO_MEMBER_ROLES = [ 'owner', 'editor', 'viewer' ] as const;

  private static listIds < T extends string > ( table: 'asset_types' | 'liquidation_levels' | 'booking_types' ) : T[] {
    return as< { id: T }[] >( conn().prepare( `SELECT id FROM ${ table } ORDER BY rowid` ).all() ).map( ( { id } ) => id );
  }

  public static listCurrencies () : CurrencyRecord[] {
    return as< CurrencyRow[] >( conn().prepare( 'SELECT * FROM currencies ORDER BY code' ).all() ).map( row => ( {
      code: row.code, symbol: row.symbol, decimalPlaces: row.decimal_places
    } ) );
  }

  public static getCurrency ( code: string ) : CurrencyRecord {
    const currencyCode = parseString( code, 'Currency' ).toUpperCase();
    const row = as< CurrencyRow | null >( conn().prepare( 'SELECT * FROM currencies WHERE code = ?' ).get( currencyCode ) );

    if ( ! row ) throw new Error( `Unknown currency: ${ currencyCode }` );
    return { code: row.code, symbol: row.symbol, decimalPlaces: row.decimal_places };
  }
}
