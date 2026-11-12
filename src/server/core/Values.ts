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
}
