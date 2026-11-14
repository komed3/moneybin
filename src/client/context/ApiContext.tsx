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


  const request = useCallback( async < T, > ( path: string, options: ApiRequestOptions = {} ) : Promise< T > => {
    const url = new URL( `${ API }${ path }`, window.location.origin );

    for ( const [ key, value ] of Object.entries( options.query ?? {} ) )
      if ( value !== undefined && value !== null ) url.searchParams.set( key, String( value ) );

    const headers = new Headers( options.headers );

    if ( token ) headers.set( 'Authorization', `Bearer ${ token }` );
    if ( options.body !== undefined && ! headers.has( 'Content-Type' ) )
      headers.set( 'Content-Type', 'application/json' );

    const { query: _, ...init } = options;

    return fetch( url, { ...init, headers } ).then( async res => {
      if ( res.status === 401 && path !== '/auth/login' ) {
        localStorage.removeItem( TOKEN_KEY );
        setToken( null ), setUser( null );
      }

      if ( ! res.ok ) {
        let message = res.statusText || 'API request failed';

        try {
          const body = await res.json() as { error?: string };
          if ( body.error ) message = body.error;
        } catch {}

        setError( message );
        throw new ApiError( message, res.status );
      }

      setError( null );

      if ( res.status === 204 ) return undefined as T;
      if ( res.headers.get( 'Content-Type' )?.includes( 'application/json' ) )
        return res.json() as Promise< T >;

      return res as T;
    } ).catch( err => {
      if ( ! ( err instanceof ApiError ) ) setError(
        err instanceof Error ? err.message : 'Network request failed'
      );

      throw err;
    } );
  }, [ token ] );
}
