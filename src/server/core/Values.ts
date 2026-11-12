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
    return this.currencies.map( ( { code } ) => code );
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
}
