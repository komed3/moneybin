import { confirm, promptConfirmedPassword } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { User } from '@/src/server/core/User';
import { Command } from 'commander';


export const registerUserCommands = ( program: Command ) : void => {
  const userCommand = program
    .command( 'user' )
    .description( 'Manage user accounts' );

  userCommand
    .command( 'list' )
    .description( 'List all users' )
    .action( () => {
      const users = User.list();
      if ( ! users.length ) return ui.info( 'No users found.' );

      console.table( users.map( ( { id, username, createdAt, updatedAt } ) => ( {
        id, username, createdAt, updatedAt
      } ) ) );
    } );

  userCommand
    .command( 'create <username>' )
    .description( 'Create a user account' )
    .action( async ( username: string ) => {
      const name = User.validateUsername( username );
      if ( User.getByUsername( name ) ) throw new Error( 'Username is already taken' );

      const pw = await promptConfirmedPassword( pw => User.validatePassword( pw ) );
      const created = await User.create( name, pw );

      ui.nl();
      ui.success( `Created user ${ created.username } (ID ${ created.id })` );
    } );

  userCommand
    .command( 'delete <user>' )
    .description( 'Delete a user by ID or username' )
    .option( '-y, --yes', 'Skip confirmation' )
    .action( async ( ref: string, options: { yes?: boolean } ) => {
      const target = User.resolveUser( ref );

      if ( ! options.yes && ! await confirm( `Delete user ${ target.username } (ID ${ target.id })?` ) )
        return ui.cancelled();

      User.delete( target.id );
      ui.success( `Deleted user ${ target.username } (ID ${ target.id })` );
    } );
}
