import { normalizeString, validateBoolean, validateEnum, validateNumber } from '@/src/server/utils';
import type { ConfigName, ConfigSchema, ConfigTable, ConfigValue } from '@/src/shared/types/config';
import dotenv from 'dotenv';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
