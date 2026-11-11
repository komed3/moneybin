import { as, conn, db } from '@/src/server/core/Database';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseBoolean, parseDate, parseEnum, parseString } from '@/src/server/utils';
import type {
  AssetCreateData, AssetLiquidationLevel, AssetRecord, AssetRow,
  AssetStatus, AssetType, AssetUpdateData
} from '@/src/shared/types/asset';
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

  private static validate ( data: AssetCreateData | AssetUpdateData, create = false ) : void {
    data.type = parseEnum< AssetType >( data.type ?? ( create ? '' : undefined ), 'type', [
      'cash', 'account', 'depot', 'collection', 'property', 'lease', 'debt', 'receivable',
      'contract', 'investment', 'insurance', 'vehicle', 'valuable', 'right', 'other'
    ] );

    data.liquidationLevel = parseEnum< AssetLiquidationLevel >( data.liquidationLevel ?? ( create ? '' : undefined ), 'liquidation level', [
      'instant', 'very_high', 'high', 'medium', 'low', 'very_low', 'illiquid'
    ] );

    data.name = parseString( create ? data.name ?? '' : data.name, 'Name' );
    data.description = parseString( data.description, 'Description', true );
    data.status = parseEnum< AssetStatus >( data.status ?? ( create ? '' : undefined ), 'status', [ 'real', 'fictional' ] );
    data.archived = parseBoolean( data.archived, 'Archived' );
    data.icon = parseString( create ? data.icon ?? '' : data.icon, 'Icon' );
    data.color = parseString( create ? data.color ?? '' : data.color, 'Color' );
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

  public static create ( portfolioId: string, userId: string, data: AssetCreateData ) : AssetRecord {
    Asset.validate( data, true );
    Portfolio.assertEditable( portfolioId, userId );

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
