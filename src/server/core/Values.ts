import { as, conn } from '@/src/server/core/Database';
import { parseEnum, parseString } from '@/src/server/utils';
import type { AssetLiquidationLevel, AssetStatus, AssetType } from '@/src/shared/types/asset';
import type { BookingReliability, BookingType, BookingValueType } from '@/src/shared/types/booking';
import type { PersonGender } from '@/src/shared/types/person';
import type { PortfolioMemberRole } from '@/src/shared/types/portfolio';
import type { CurrencyRecord, CurrencyRow } from '@/src/shared/types/values';


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

  public static parseCurrency ( value: string | undefined ) : string | undefined {
    const code = parseString( value, 'Currency' );
    return code === undefined ? undefined : this.getCurrency( code ).code;
  }

  public static listAssetTypes () : AssetType[] {
    return this.listIds< AssetType >( 'asset_types' );
  }

  public static parseAssetType ( value: unknown ) : AssetType | undefined {
    return parseEnum< AssetType >( value, 'type', this.listAssetTypes() );
  }

  public static listLiquidationLevels () : AssetLiquidationLevel[] {
    return this.listIds< AssetLiquidationLevel >( 'liquidation_levels' );
  }

  public static parseLiquidationLevel ( value: unknown ) : AssetLiquidationLevel | undefined {
    return parseEnum< AssetLiquidationLevel >( value, 'liquidation level', this.listLiquidationLevels() );
  }

  public static listBookingTypes () : BookingType[] {
    return this.listIds< BookingType >( 'booking_types' );
  }

  public static parseBookingType ( value: unknown ) : BookingType | undefined {
    return parseEnum< BookingType >( value, 'type', this.listBookingTypes() );
  }

  public static listAssetStatuses () : AssetStatus[] {
    return [ ...this.ASSET_STATUSES ];
  }

  public static parseAssetStatus ( value: unknown ) : AssetStatus | undefined {
    return parseEnum< AssetStatus >( value, 'status', this.ASSET_STATUSES );
  }

  public static listBookingValueTypes () : BookingValueType[] {
    return [ ...this.BOOKING_VALUE_TYPES ];
  }

  public static parseBookingValueType ( value: unknown ) : BookingValueType | undefined {
    return parseEnum< BookingValueType >( value, 'value type', this.BOOKING_VALUE_TYPES );
  }

  public static listBookingReliabilities () : BookingReliability[] {
    return [ ...this.BOOKING_RELIABILITIES ];
  }

  public static parseBookingReliability ( value: unknown ) : BookingReliability | undefined {
    return parseEnum< BookingReliability >( value, 'reliability', this.BOOKING_RELIABILITIES );
  }

  public static listPersonGenders () : PersonGender[] {
    return [ ...this.PERSON_GENDERS ];
  }

  public static parsePersonGender ( value: unknown ) : PersonGender | undefined {
    return parseEnum< PersonGender >( value, 'gender', this.PERSON_GENDERS );
  }

  public static listPortfolioMemberRoles () : PortfolioMemberRole[] {
    return [ ...this.PORTFOLIO_MEMBER_ROLES ];
  }

  public static parsePortfolioMemberRole ( value: unknown ) : PortfolioMemberRole {
    return parseEnum< PortfolioMemberRole, true >( value, 'role', this.PORTFOLIO_MEMBER_ROLES, true );
  }
}
