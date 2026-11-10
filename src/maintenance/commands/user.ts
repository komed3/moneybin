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

      console.table( users.map( user => ( {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } ) ) );
    } );
}
