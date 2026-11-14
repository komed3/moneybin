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

export interface ApiValues {
  currencies: CurrencyRecord[];
  personGenders: readonly PersonGender[];
  portfolioMemberRoles: readonly PortfolioMemberRole[];
  assetTypes: AssetType[];
  liquidationLevels: LiquidationLevel[];
  assetStatuses: readonly AssetStatus[];
  bookingTypes: BookingType[];
  bookingValueTypes: readonly BookingValueType[];
  bookingReliabilities: readonly BookingReliability[];
}

export interface Api {
  request: < T >( path: string, options?: ApiRequestOptions ) => Promise< T >;
  login: ( credentials: ApiLogin ) => Promise< void >;
  logout: () => Promise< void >;
  refreshSession: () => Promise< void >;
  clearError: () => void;

  persons: {
    list: () => Promise< PersonRecord[] >;
    create: ( data: PersonCreateData ) => Promise< PersonRecord >;
    get: ( id: string ) => Promise< PersonRecord >;
    update: ( id: string, data: PersonUpdateData ) => Promise< PersonRecord >;
    delete: ( id: string ) => Promise< void >;
  };

  portfolios: {
    list: () => Promise< PortfolioRecord[] >;
    create: ( data: PortfolioCreateData ) => Promise< PortfolioRecord >;
    get: ( id: string ) => Promise< PortfolioRecord >;
    update: ( id: string, data: PortfolioUpdateData ) => Promise< PortfolioRecord >;
    delete: ( id: string ) => Promise< void >;
    members: ( id: string ) => Promise< PortfolioMemberRecord[] >;
    addMember: ( id: string, userId: string, role: PortfolioMemberRole ) => Promise< PortfolioMemberRecord >;
    updateMember: ( id: string, memberId: string, role: PortfolioMemberRole ) => Promise< PortfolioMemberRecord >;
    removeMember: ( id: string, memberId: string ) => Promise< void >;
  };

  assets: {
    list: ( portfolioId: string ) => Promise< AssetRecord[] >;
    create: ( portfolioId: string, data: AssetCreateData ) => Promise< AssetRecord >;
    get: ( id: string ) => Promise< AssetRecord >;
    update: ( id: string, data: AssetUpdateData ) => Promise< AssetRecord >;
    delete: ( id: string ) => Promise< void >;
  };

  bookings: {
    list: ( assetId: string ) => Promise< BookingRecord[] >;
    listByPortfolio: ( portfolioId: string ) => Promise< BookingRecord[] >;
    create: ( data: BookingCreateData ) => Promise< BookingRecord >;
    get: ( id: string ) => Promise< BookingRecord >;
    update: ( id: string, data: BookingUpdateData ) => Promise< BookingRecord >;
    delete: ( id: string ) => Promise< void >;
  };

  transactions: {
    list: ( portfolioId: string ) => Promise< TransactionRecord[] >;
    create: ( portfolioId: string, data: TransactionCreateData ) => Promise< TransactionRecord >;
    get: ( id: string ) => Promise< TransactionRecord >;
    update: ( id: string, data: TransactionUpdateData ) => Promise< TransactionRecord >;
    delete: ( id: string ) => Promise< void >;
  };

  daily: {
    list: ( assetId: string ) => Promise< DailyValueRecord[] >;
    get: ( assetId: string, date: string ) => Promise< DailyValueRecord >;
  };

  stats: {
    asset: ( assetId: string ) => Promise< YearlyRecord[] >;
    assetYear: ( assetId: string, year: number ) => Promise< YearlyRecord >;
    portfolio: ( portfolioId: string ) => Promise< PortfolioYearlyRecord[] >;
    portfolioYear: ( portfolioId: string, year: number ) => Promise< PortfolioYearlyRecord >;
  };

  values: () => Promise< ApiValues >;
}
