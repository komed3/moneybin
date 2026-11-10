#!/usr/bin/env node

import { registerAuthCommands } from '@/src/maintenance/commands/auth';
import { registerConfigCommands } from '@/src/maintenance/commands/config';
import { registerDbCommands } from '@/src/maintenance/commands/db';
import { ui } from '@/src/maintenance/utils/ui';
import { db } from '@/src/server/core/Database';
import { Command } from 'commander';


const moneybin = new Command();

moneybin
  .name( 'moneybin' )
  .version( '1.0.0' )
  .description(
    'MoneyBin, open-source net worth tracking software.\n' +
    'Copyright (c) 2026 komed3. MIT license.\n\n' +
    'Maintenance script.'
  );


moneybin.commandsGroup( 'System:' );
registerConfigCommands( moneybin );
registerDbCommands( moneybin );

moneybin.commandsGroup( 'Authentication:' );
registerAuthCommands( moneybin );
