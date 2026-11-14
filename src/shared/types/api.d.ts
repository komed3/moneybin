import type { AuthResult } from '@/src/shared/types/auth';
import type { AssetCreateData, AssetRecord, AssetUpdateData } from '@/src/shared/types/asset';
import type { BookingCreateData, BookingRecord, BookingUpdateData } from '@/src/shared/types/booking';
import type { DailyValueRecord } from '@/src/shared/types/daily';
import type { PersonCreateData, PersonRecord, PersonUpdateData } from '@/src/shared/types/person';
import type { PortfolioCreateData, PortfolioMemberRecord, PortfolioRecord, PortfolioUpdateData } from '@/src/shared/types/portfolio';
import type { PortfolioYearlyRecord, YearlyRecord } from '@/src/shared/types/stats';
import type { TransactionCreateData, TransactionRecord, TransactionUpdateData } from '@/src/shared/types/transaction';
import type { UserRecord } from '@/src/shared/types/user';
import type {
  CurrencyRecord, CurrencyCode, PersonGender, PortfolioMemberRole, AssetStatus, AssetType,
  LiquidationLevel, BookingType, BookingValueType, BookingReliability
} from '@/src/shared/types/values';


export interface ApiEnv {
  appName: string;
  defaultLanguage: string;
  defaultCurrency: CurrencyCode;
  passwordStrict: boolean;
}

export interface ApiLogin {
  username: string;
  password: string;
}

export interface ApiRequestOptions extends Omit< RequestInit, 'body' > {
  body?: BodyInit | null;
  query?: Record< string, string | number | boolean | null | undefined >;
}
