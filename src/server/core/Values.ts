import { as, conn } from '@/src/server/core/Database';
import { parseEnum } from '@/src/server/utils';
import type {
  AssetStatus, AssetType, BookingReliability, BookingType, BookingValueType, CurrencyCode,
  CurrencyRecord, CurrencyRow, LanguageCode, LiquidationLevel, NodeEnvironment, PersonGender,
  PortfolioMemberRole
} from '@/src/shared/types/values';
