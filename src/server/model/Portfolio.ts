import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Values } from '@/src/server/core/Values';
import { Person } from '@/src/server/model/Person';
import { assertId, parseString } from '@/src/server/utils';
import type {
  PortfolioCreateData, PortfolioMemberRecord, PortfolioMemberRow, PortfolioRecord,
  PortfolioRow, PortfolioUpdateData
} from '@/src/shared/types/portfolio';
import type { PortfolioMemberRole } from '@/src/shared/types/values';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';


const COLS = { personId: 'person_id', name: 'name', description: 'description', currency: 'currency', note: 'note' };
