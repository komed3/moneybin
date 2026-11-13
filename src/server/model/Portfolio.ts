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


export class Portfolio {
  private static getRow ( portfolioId: string ) : PortfolioRow | null {
    assertId( portfolioId, 'portfolio' );
    return as< PortfolioRow | null >( conn().prepare( 'SELECT * FROM portfolios WHERE id = ?' ).get( portfolioId ) );
  }

  private static toRecord ( row: PortfolioRow ) : PortfolioRecord {
    return {
      id: row.id, personId: row.person_id, name: row.name, description: row.description,
      currency: row.currency, note: row.note, createdAt: row.created_at, updatedAt: row.updated_at
    };
  }
}
