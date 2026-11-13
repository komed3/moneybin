import type { AssetStatus, AssetType, LiquidationLevel } from '@/src/shared/types/values';


export interface AssetRecord {
  id: string;
  portfolioId: string;
  type: AssetType;
  liquidationLevel: LiquidationLevel;
  name: string;
  description: string | null;
  status: AssetStatus;
  archived: boolean;
  icon: string;
  color: string;
  street: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  note: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
