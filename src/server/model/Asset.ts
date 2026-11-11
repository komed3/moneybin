import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { assertId, normalizeString, validateBoolean, validateEnum } from '@/src/server/utils';
import type {
  AssetCreateData, AssetLiquidationLevel, AssetRecord, AssetRow,
  AssetStatus, AssetType, AssetUpdateData
} from '@/src/shared/types/asset';
import { SQLInputValue } from 'node:sqlite';
