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

  private static validate ( data: AssetUpdateData ) : void {
    data.type = Values.validateAssetType( data.type ) ?? undefined;
    data.liquidationLevel = Values.validateLiquidationLevel( data.liquidationLevel ) ?? undefined;
    data.name = parseString( data.name, 'Name' );
    data.description = parseString( data.description, 'Description', true );
    data.status = Values.validateAssetStatus( data.status ) ?? undefined;
    data.archived = parseBoolean( data.archived, 'Archived' );
    data.icon = parseString( data.icon, 'Icon' );
    data.color = parseString( data.color, 'Color' );
    data.street = parseString( data.street, 'Street', true );
    data.addressExtra = parseString( data.addressExtra, 'Address extra', true );
    data.postalCode = parseString( data.postalCode, 'Postal code', true );
    data.city = parseString( data.city, 'City', true );
    data.region = parseString( data.region, 'Region', true );
    data.country = parseString( data.country, 'Country', true );
    data.note = parseString( data.note, 'Note', true );
    data.openedAt = parseDate( data.openedAt, 'Opened at', true );
    data.closedAt = parseDate( data.closedAt, 'Closed at', true );
  }

  public static assertAssetIdSafe ( assetId: string, userId: string ) : void {
    assertId( assetId, 'asset' );

    if ( ! conn().prepare( `
      SELECT 1
      FROM assets a
      JOIN portfolio_members pm ON pm.portfolio_id = a.portfolio_id
      WHERE a.id = ? AND pm.user_id = ?
    ` ).get( assetId, userId ) ) throw new Error( `Asset ${ assetId } does not exist` );
  }

  public static list ( portfolioId: string, userId: string ) : AssetRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< AssetRow[] >( conn().prepare(
      'SELECT * FROM assets WHERE portfolio_id = ? ORDER BY name COLLATE NOCASE'
    ).all( portfolioId ) ).map( Asset.toRecord );
  }

  public static get ( assetId: string, userId: string ) : AssetRecord | null {
    const row = Asset.getRow( assetId );
    if ( ! row ) return null;

    Portfolio.assertMember( row.portfolio_id, userId );
    return Asset.toRecord( row );
  }

  public static getSafe ( assetId: string, userId: string ) : AssetRecord {
    const asset = Asset.get( assetId, userId );
    if ( ! asset ) throw new Error( `Asset ${ assetId } does not exist` );
    return asset;
  }
}
