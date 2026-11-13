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


export class Asset {
  private static getRow ( assetId: string ) : AssetRow | null {
    assertId( assetId, 'asset' );
    return as< AssetRow | null >( conn().prepare( 'SELECT * FROM assets WHERE id = ?' ).get( assetId ) );
  }

  private static toRecord ( row: AssetRow ) : AssetRecord {
    return {
      id: row.id, portfolioId: row.portfolio_id, type: row.type, liquidationLevel: row.liquidation_level,
      name: row.name, description: row.description, status: row.status, archived: !! row.archived,
      icon: row.icon, color: row.color, street: row.street, addressExtra: row.address_extra,
      postalCode: row.postal_code, city: row.city, region: row.region, country: row.country,
      note: row.note, openedAt: row.opened_at, closedAt: row.closed_at, createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
