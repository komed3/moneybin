import { as, conn, db } from '@/src/server/core/Database';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, normalizeString, validateBoolean, validateEnum } from '@/src/server/utils';
import type {
  AssetCreateData, AssetLiquidationLevel, AssetRecord, AssetRow, AssetStatus,
  AssetType, AssetUpdateData
} from '@/src/shared/types/asset';
import { SQLInputValue } from 'node:sqlite';


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
    Portfolio.assertEditable( portfolioId, userId );
    Asset.validate( data );

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
    const row = Asset.getRow( assetId );
    if ( ! row ) throw new Error( `Asset ${ assetId } does not exist` );

    Portfolio.assertEditable( row.portfolio_id, userId );
    Asset.validate( data );

    const entries = Object.entries( COLS ).filter( ( [ k ] ) => data[ k as keyof AssetUpdateData ] !== undefined );
    if ( ! entries.length ) return Asset.toRecord( row );

    const values = entries.map( ( [ key ] ) => {
      const value = data[ key as keyof AssetUpdateData ];
      return key === 'archived' ? Number( value ) : value;
    } );

    conn().prepare( `
      UPDATE assets
      SET ${ entries.map( ( [ , column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ?
    ` ).run( ...values as SQLInputValue[], assetId );

    return Asset.toRecord( Asset.getRow( assetId )! );
  }

  public static delete ( assetId: string, userId: string ) : void {
    const row = Asset.getRow( assetId );
    if ( ! row ) throw new Error( `Asset ${ assetId } does not exist` );

    Portfolio.assertEditable( row.portfolio_id, userId );
    conn().prepare( 'DELETE FROM assets WHERE id = ?' ).run( assetId );
  }
}
