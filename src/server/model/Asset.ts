import { as, conn, db } from '@/src/server/core/Database';
import { Values } from '@/src/server/core/Values';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseBoolean, parseDate, parseString } from '@/src/server/utils';
import type { AssetCreateData, AssetRecord, AssetRow, AssetUpdateData } from '@/src/shared/types/asset';
import type { SQLInputValue } from 'node:sqlite';


const COLS = {
  type: 'type', liquidationLevel: 'liquidation_level', name: 'name', description: 'description',
  status: 'status', archived: 'archived', icon: 'icon', color: 'color', street: 'street',
  addressExtra: 'address_extra', postalCode: 'postal_code', city: 'city', region: 'region',
  country: 'country', note: 'note', openedAt: 'opened_at', closedAt: 'closed_at'
};
