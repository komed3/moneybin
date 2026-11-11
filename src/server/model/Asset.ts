import { as, conn, db } from '@/src/server/core/Database';
import { Portfolio } from '@/src/server/model/Portfolio';
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


export class Asset {
  private static getRow ( assetId: string, userId: string ) : AssetRow | null {
    assertId( assetId, 'asset' );

    return as< AssetRow | null >( conn().prepare( `
      SELECT a.*
      FROM assets a
      JOIN portfolio_members pm ON pm.portfolio_id = a.portfolio_id
      WHERE a.id = ? AND pm.user_id = ?
    ` ).get( assetId, userId ) );
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

  private static validateName ( name: string ) : string {
    return normalizeString( name, 'Name' );
  }

  private static validateType ( type: unknown ) : AssetType {
    return validateEnum( type, 'type', [
      'cash', 'account', 'depot', 'collection', 'property', 'lease', 'debt', 'receivable',
      'contract', 'investment', 'insurance', 'vehicle', 'valuable', 'right', 'other'
    ] );
  }

  private static validateLiquidationLevel ( level: unknown ) : AssetLiquidationLevel {
    return validateEnum( level, 'liquidation level', [
      'instant', 'very_high', 'high', 'medium', 'low', 'very_low', 'illiquid'
    ] );
  }

  private static validateStatus ( status: unknown ) : AssetStatus {
    return validateEnum( status, 'status', [ 'real', 'fictional' ] );
  }
}
