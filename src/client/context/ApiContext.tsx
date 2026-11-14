import type { Api, ApiContextValue, ApiEnv, ApiLogin, ApiRequestOptions, ApiValues } from '@/src/shared/types/api';
import type { AuthResult } from '@/src/shared/types/auth';
import type { AssetRecord } from '@/src/shared/types/asset';
import type { BookingRecord } from '@/src/shared/types/booking';
import type { DailyValueRecord } from '@/src/shared/types/daily';
import type { PersonRecord } from '@/src/shared/types/person';
import type { PortfolioMemberRecord, PortfolioRecord } from '@/src/shared/types/portfolio';
import type { PortfolioYearlyRecord, YearlyRecord } from '@/src/shared/types/stats';
import type { TransactionRecord } from '@/src/shared/types/transaction';
import type { UserRecord } from '@/src/shared/types/user';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';


const API = '/api';
const TOKEN_KEY = 'moneybin.session';


export class ApiError extends Error {
  constructor ( message: string, public status: number ) {
    super( message );
    this.name = 'ApiError';
  }
}


const ApiContext = createContext< ApiContextValue | null >( null );


export function ApiProvider ( { children }: { children: ReactNode } ) {
  const [ env, setEnv ] = useState< ApiEnv | null >( null );
  const [ token, setToken ] = useState< string | null >( () => localStorage.getItem( TOKEN_KEY ) );
  const [ user, setUser ] = useState< UserRecord | null >( null );
  const [ loading, setLoading ] = useState( true );
  const [ error, setError ] = useState< string | null >( null );
}
