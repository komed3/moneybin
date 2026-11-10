import { confirm, promptConfirmedPassword } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { User } from '@/src/server/core/User';
import { Command } from 'commander';


export const registerUserCommands = ( program: Command ) : void => {
  const userCommand = program
    .command( 'user' )
    .description( 'Manage user accounts' );
}
