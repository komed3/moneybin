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

  private static validate ( data: AssetCreateData | AssetUpdateData ) : void {
    if ( data.type !== undefined ) data.type = validateEnum< AssetType >( data.type, 'type', [
      'cash', 'account', 'depot', 'collection', 'property', 'lease', 'debt', 'receivable',
      'contract', 'investment', 'insurance', 'vehicle', 'valuable', 'right', 'other'
    ] );

    if ( data.liquidationLevel !== undefined ) data.liquidationLevel = validateEnum< AssetLiquidationLevel >(
      data.liquidationLevel, 'liquidation level', [ 'instant', 'very_high', 'high', 'medium', 'low', 'very_low', 'illiquid' ]
    );

    if ( data.name !== undefined ) data.name = normalizeString( data.name, 'Name' );
    if ( data.status !== undefined ) data.status = validateEnum< AssetStatus >( data.status, 'status', [ 'real', 'fictional' ] );
    if ( data.archived !== undefined ) data.archived = validateBoolean( data.archived, 'Archived' );
    if ( data.icon !== undefined ) data.icon = normalizeString( data.icon, 'Icon' );
    if ( data.color !== undefined ) data.color = normalizeString( data.color, 'Color' );
  }

  public static list ( portfolioId: string, userId: string ) : AssetRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< AssetRow[] >( conn().prepare(
      'SELECT * FROM assets WHERE portfolio_id = ? ORDER BY name COLLATE NOCASE'
    ).all( portfolioId ) ).map( Asset.toRecord );
  }
}
