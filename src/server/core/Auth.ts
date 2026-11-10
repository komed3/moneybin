import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import type { ActiveSession, AuthResult, SessionRow } from '@/src/shared/types/auth';
import type { UserRecord } from '@/src/shared/types/user';
import { createHash, randomBytes } from 'node:crypto';
