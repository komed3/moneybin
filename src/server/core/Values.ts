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
