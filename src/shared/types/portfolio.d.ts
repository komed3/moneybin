import type { CurrencyCode, PortfolioMemberRole } from '@/src/shared/types/values';


export interface PortfolioRecord {
  id: string;
  personId: string;
  name: string;
  description: string | null;
  currency: CurrencyCode;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioRow {
  id: string;
  person_id: string;
  name: string;
  description: string | null;
  currency: CurrencyCode;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreateData {
  personId: string;
  name: string;
  description?: string | null;
  currency: CurrencyCode;
  note?: string | null;
}

export type PortfolioUpdateData = Partial< PortfolioCreateData >;

export interface PortfolioMemberRecord {
  portfolioId: string;
  userId: string;
  username: string;
  role: PortfolioMemberRole;
  createdAt: string;
}

export interface PortfolioMemberRow {
  portfolio_id: string;
  user_id: string;
  username: string;
  role: PortfolioMemberRole;
  created_at: string;
}
