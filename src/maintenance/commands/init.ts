import { prompt, confirm, promptConfirmedPassword } from '@/src/maintenance/utils/prompt';
import { ui } from '@/src/maintenance/utils/ui';
import { Config } from '@/src/server/core/Config';
import { Database, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import type { ConfigName, ConfigValue } from '@/src/shared/types/config';
import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
