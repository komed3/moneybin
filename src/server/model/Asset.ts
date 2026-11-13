import { as, conn, db } from '@/src/server/core/Database';
import { Values } from '@/src/server/core/Values';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseBoolean, parseDate, parseString, toRecord, toRow } from '@/src/server/utils';
import type { AssetCreateData, AssetRecord, AssetRow, AssetUpdateData } from '@/src/shared/types/asset';
import type { SQLInputValue } from 'node:sqlite';


const COLS = {
  id: 'id', portfolioId: 'portfolio_id', type: 'type', liquidationLevel: 'liquidation_level',
  name: 'name', description: 'description', status: 'status', archived: 'archived', icon: 'icon',
  color: 'color', street: 'street', addressExtra: 'address_extra', postalCode: 'postal_code',
  city: 'city', region: 'region', country: 'country', note: 'note', openedAt: 'opened_at',
  closedAt: 'closed_at', createdAt: 'created_at', updatedAt: 'updated_at'
};


export class Asset {
  private static getRow ( assetId: string ) : AssetRow | null {
    assertId( assetId, 'asset' );
    return as< AssetRow | null >( conn().prepare( 'SELECT * FROM assets WHERE id = ?' ).get( assetId ) );
  }

  private static toRecord ( row: AssetRow ) : AssetRecord {
    const record = toRecord< AssetRecord >( row, COLS );
    return { ...record, archived: !! record.archived };
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

  public static create ( portfolioId: string, userId: string, data: AssetCreateData ) : AssetRecord {
    Asset.validate( data );
    Portfolio.assertEditable( portfolioId, userId );

    if ( ! data.type || ! data.liquidationLevel || ! data.name || ! data.status || ! data.icon || ! data.color )
      throw new Error( 'Asset is missing required fields' );

    const id = db.createWithId( id => {
      conn().prepare( `
        INSERT INTO assets (
          id, portfolio_id, type, liquidation_level, name, description, status, archived,
          icon, color, street, address_extra, postal_code, city, region, country, note,
          opened_at, closed_at
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ` ).run(
        id, portfolioId, data.type, data.liquidationLevel, data.name, data.description ?? null,
        data.status, Number( data.archived ?? false ), data.icon, data.color,
        data.street ?? null, data.addressExtra ?? null, data.postalCode ?? null,
        data.city ?? null, data.region ?? null, data.country ?? null, data.note ?? null,
        data.openedAt ?? null, data.closedAt ?? null
      );

      return id;
    } );

    return Asset.toRecord( Asset.getRow( id )! );
  }

  public static update ( assetId: string, userId: string, data: AssetUpdateData ) : AssetRecord {
    const asset = Asset.getSafe( assetId, userId );
    Portfolio.assertEditable( asset.portfolioId, userId );
    Asset.validate( data );

    const entries = Object.entries( toRow( data, COLS ) );
    if ( ! entries.length ) return asset;

    const values = entries.map( ( [ col, v ] ) => col === 'archived' ? Number( v ) : v );

    conn().prepare( `
      UPDATE assets
      SET ${ entries.map( ( [ column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ?
    ` ).run( ...values as SQLInputValue[], assetId );

    return Asset.getSafe( assetId, userId );
  }

  public static delete ( assetId: string, userId: string ) : void {
    const asset = Asset.getSafe( assetId, userId );
    Portfolio.assertEditable( asset.portfolioId, userId );
    conn().prepare( 'DELETE FROM assets WHERE id = ?' ).run( assetId );
  }
}
