import { confirm } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { db } from '@/src/server/core/Database';
import { Command } from 'commander';


export const registerDbCommands = ( program: Command ) : void => {
  const dbCommand = program
    .command( 'db' )
    .description( 'Manage the database' );

  dbCommand
    .command( 'migrations' )
    .description( 'List applied database migrations' )
    .action( () => {
      const migrations = db.listMigrations();
      if ( ! migrations.length ) return ui.info( 'No applied migrations.' );

      console.table( migrations.map( ( { name, checksum, appliedAt } ) => ( {
        name, checksum: checksum.slice( 0, 12 ), appliedAt
      } ) ) );
    } );

  dbCommand
    .command( 'stats' )
    .description( 'Show general database statistics' )
    .action( () => {
      const stats = db.getStats();

      if ( stats.integrityCheck === 'ok' ) ui.success( 'Database integrity: ok' );
      else ui.error( `Database integrity: ${ stats.integrityCheck }` );

      console.table( [
        { stat: 'Database path', value: stats.path },
        { stat: 'SQLite version', value: stats.sqliteVersion },
        { stat: 'Tables', value: stats.tableCount },
        { stat: 'Rows', value: stats.rowCount },
        { stat: 'Applied migrations', value: stats.migrationCount },
        { stat: 'Disk usage', value: `${ stats.sizeBytes.toLocaleString() } bytes` },
        { stat: 'Pages', value: stats.pageCount },
        { stat: 'Page size', value: `${ stats.pageSize } bytes` },
        { stat: 'Free pages', value: stats.freePages }
      ] );
    } );
}
