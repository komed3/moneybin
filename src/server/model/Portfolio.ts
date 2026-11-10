import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Person } from '@/src/server/model/Person';
import { assertId, normalizeString, validateEnum } from '@/src/server/utils';
import type {
  PortfolioCreateData, PortfolioMemberRecord, PortfolioMemberRole, PortfolioMemberRow,
  PortfolioRecord, PortfolioRow, PortfolioUpdateData
} from '@/src/shared/types/portfolio';
import { SQLInputValue } from 'node:sqlite';
