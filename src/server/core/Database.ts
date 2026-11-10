import { Config } from '@/src/server/core/Config';
import { generateId } from '@/src/server/utils';
import type { AppliedMigration, DatabaseStats } from '@/src/shared/types/database';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync, backup as sqliteBackup } from 'node:sqlite';


export class Database {
  private connection: DatabaseSync | null = null;
  private transactionActive = false;

  private static isPrimaryKeyCollision ( err: unknown ) : boolean {
    return typeof err === 'object' && err !== null && 'errcode' in err && err.errcode === 1555;
  }

  private migrate () : void {
    const db = this.db;
    const migrationsPath = resolve( 'schema/migrations' );

    db.exec( `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
      );
    ` );

    for ( const name of readdirSync( migrationsPath ).filter( ( name ) => /^.*\.sql$/i.test( name ) ).sort() ) {
      const sql = readFileSync( join( migrationsPath, name ), 'utf8' );
      const checksum = createHash( 'sha256' ).update( sql ).digest( 'hex' );
      const existing = db.prepare( 'SELECT checksum FROM schema_migrations WHERE name = ?' ).get( name );

      if ( existing ) {
        if ( typeof existing !== 'object' || ! ( 'checksum' in existing ) || existing.checksum !== checksum )
          throw new Error( `An already applied migration has been modified: ${ name }` );

        continue;
      }

      this.transaction( tx => {
        tx.exec( sql );
        tx.prepare( 'INSERT INTO schema_migrations ( name, checksum ) VALUES ( ?, ? )' ).run( name, checksum );
      } );
    }
  }

  public get isOpen () : boolean {
    return this.connection !== null;
  }

  public get db () : DatabaseSync {
    if ( ! this.connection ) throw new Error( 'Database connection is not open' );
    return this.connection;
  }

  public open () : this {
    if ( this.connection ) return this;

    const path = Config.get( 'DB_PATH' );
    if ( path !== ':memory:' ) mkdirSync( dirname( path ), { recursive: true } );

    const conn = new DatabaseSync( path );

    try {
      conn.exec( `
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = ${ Config.get( 'DB_BUSY_TIMEOUT_MS' ) };
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
      ` );

      this.connection = conn;
      this.migrate();

      return this;
    } catch ( err ) {
      this.connection = null;
      conn.close();

      throw err;
    }
  }

  public close () : void {
    if ( ! this.connection ) return;
    if ( this.transactionActive ) throw new Error( 'Database cannot be closed while a transaction is running' );

    this.connection.close();
    this.connection = null;
  }

  public listMigrations () : AppliedMigration[] {
    return as< AppliedMigration[] >( this.open().db.prepare(
      'SELECT name, checksum, applied_at AS appliedAt FROM schema_migrations ORDER BY applied_at, name'
    ).all() );
  }
}
