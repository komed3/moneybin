#!/usr/bin/env node

import { registerAuthCommands } from '@/src/maintenance/commands/auth';
import { registerConfigCommands } from '@/src/maintenance/commands/config';
import { registerDbCommands } from '@/src/maintenance/commands/db';
import { ui } from '@/src/maintenance/utils/ui';
import { db } from '@/src/server/core/Database';
import { Command } from 'commander';


const moneybin = new Command();
