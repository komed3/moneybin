import { parseBoolean, parseEnum, parseNumber, parseString } from '@/src/server/utils';
import type { ConfigName, ConfigSchema, ConfigTable, ConfigValue } from '@/src/shared/types/config';
import dotenv from 'dotenv';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';


const nodeEnv = process.env.NODE_ENV;
dotenv.config( { override: true, quiet: true } );
if ( nodeEnv !== undefined ) process.env.NODE_ENV = nodeEnv;
