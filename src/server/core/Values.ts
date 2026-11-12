import { as, conn } from '@/src/server/core/Database';
import { parseEnum } from '@/src/server/utils';
import type {
  AssetStatus, AssetType, BookingReliability, BookingType, BookingValueType, CurrencyCode,
  CurrencyRecord, CurrencyRow, LanguageCode, LiquidationLevel, NodeEnvironment, PersonGender,
  PortfolioMemberRole
} from '@/src/shared/types/values';


const NODE_ENVIRONMENTS = [ 'dev', 'development', 'test', 'prod', 'production' ] as const;
const LANGUAGES = [ 'en', 'de' ] as const;
const PERSON_GENDERS = [ 'male', 'female', 'diverse' ] as const;
const PORTFOLIO_MEMBER_ROLES = [ 'owner', 'editor', 'viewer' ] as const;
const ASSET_STATUSES = [ 'real', 'fictional' ] as const;
const BOOKING_VALUE_TYPES = [ 'relative', 'absolute' ] as const;
const BOOKING_RELIABILITIES = [ 'documented', 'reconstructed', 'speculative', 'assumed' ] as const;


export {
  NODE_ENVIRONMENTS, LANGUAGES, PERSON_GENDERS, PORTFOLIO_MEMBER_ROLES,
  ASSET_STATUSES, BOOKING_VALUE_TYPES, BOOKING_RELIABILITIES
};


export class Values {
  private static all < T > ( query: string ) : T[] {
    return as< { id: T }[] >( conn().prepare( query ).all() ).map( ( { id } ) => id );
  }

  public static get languages () : readonly LanguageCode[] {
    return LANGUAGES;
  }

  public static get nodeEnvironments () : readonly NodeEnvironment[] {
    return NODE_ENVIRONMENTS;
  }

  public static get personGenders () : readonly PersonGender[] {
    return PERSON_GENDERS;
  }

  public static get portfolioMemberRoles () : readonly PortfolioMemberRole[] {
    return PORTFOLIO_MEMBER_ROLES;
  }

  public static get assetStatuses () : readonly AssetStatus[] {
    return ASSET_STATUSES;
  }

  public static get bookingValueTypes () : readonly BookingValueType[] {
    return BOOKING_VALUE_TYPES;
  }

  public static get bookingReliabilities () : readonly BookingReliability[] {
    return BOOKING_RELIABILITIES;
  }

  public static get currencies () : CurrencyRecord[] {
    return as< CurrencyRow[] >( conn().prepare(
      'SELECT code, symbol, decimal_places FROM currencies ORDER BY code'
    ).all() ).map( ( { code, symbol, decimal_places } ) => ( {
      code, symbol, decimalPlaces: decimal_places
    } ) );
  }

  public static get currencyCodes () : CurrencyCode[] {
    return Values.currencies.map( ( { code } ) => code );
  }

  public static get assetTypes () : AssetType[] {
    return Values.all< AssetType >( 'SELECT id FROM asset_types ORDER BY id' );
  }

  public static get liquidationLevels () : LiquidationLevel[] {
    return Values.all< LiquidationLevel >( 'SELECT id FROM liquidation_levels ORDER BY id' );
  }

  public static get bookingTypes () : BookingType[] {
    return Values.all< BookingType >( 'SELECT id FROM booking_types ORDER BY id' );
  }

  public static validateLanguage ( value: unknown, required?: boolean ) : LanguageCode | null | undefined {
    return parseEnum( value, 'Language', Values.languages, required );
  }

  public static validateNodeEnvironment ( value: unknown, required?: boolean ) : NodeEnvironment | null | undefined {
    return parseEnum( value, 'Node environment', Values.nodeEnvironments, required );
  }

  public static validatePersonGender ( value: unknown, required?: boolean ) : PersonGender | null | undefined {
    return parseEnum( value, 'Person gender', Values.personGenders, required );
  }

  public static validatePortfolioMemberRole ( value: unknown, required?: boolean ) : PortfolioMemberRole | null | undefined {
    return parseEnum( value, 'Portfolio member role', Values.portfolioMemberRoles, required );
  }

  public static validateAssetStatus ( value: unknown, required?: boolean ) : AssetStatus | null | undefined {
    return parseEnum( value, 'Asset status', Values.assetStatuses, required );
  }

  public static validateBookingValueType ( value: unknown, required?: boolean ) : BookingValueType | null | undefined {
    return parseEnum( value, 'Booking value type', Values.bookingValueTypes, required );
  }

  public static validateBookingReliability ( value: unknown, required?: boolean ) : BookingReliability | null | undefined {
    return parseEnum( value, 'Booking reliability', Values.bookingReliabilities, required );
  }

  public static validateCurrencyCode ( value: unknown, required?: boolean ) : CurrencyCode | null | undefined {
    return parseEnum( value, 'Currency code', Values.currencyCodes, required );
  }

  public static validateAssetType ( value: unknown, required?: boolean ) : AssetType | null | undefined {
    return parseEnum( value, 'Asset type', Values.assetTypes, required );
  }

  public static validateLiquidationLevel ( value: unknown, required?: boolean ) : LiquidationLevel | null | undefined {
    return parseEnum( value, 'Liquidation level', Values.liquidationLevels, required );
  }

  public static validateBookingType ( value: unknown, required?: boolean ) : BookingType | null | undefined {
    return parseEnum( value, 'Booking type', Values.bookingTypes, required );
  }
}
