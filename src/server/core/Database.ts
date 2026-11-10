import { Config } from '@/src/server/core/Config';
import { generateId } from '@/src/server/utils';
import type { AppliedMigration, DatabaseStats } from '@/src/shared/types/database';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync, backup as sqliteBackup } from 'node:sqlite';
