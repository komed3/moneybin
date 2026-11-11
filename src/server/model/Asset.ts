import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { assertId, normalizeString, validateBoolean, validateEnum } from '@/src/server/utils';
import type {
  AssetCreateData, AssetLiquidationLevel, AssetRecord, AssetRow,
  AssetStatus, AssetType, AssetUpdateData
} from '@/src/shared/types/asset';
import { SQLInputValue } from 'node:sqlite';


const COLUMNS = {
  type: 'type', liquidationLevel: 'liquidation_level', name: 'name', description: 'description',
  status: 'status', archived: 'archived', icon: 'icon', color: 'color', street: 'street',
  addressExtra: 'address_extra', postalCode: 'postal_code', city: 'city', region: 'region',
  country: 'country', note: 'note', openedAt: 'opened_at', closedAt: 'closed_at'
};
