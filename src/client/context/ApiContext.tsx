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

  const refreshSession = useCallback( async () => {
    if ( ! token ) { setUser( null ), setLoading( false ); return }

    try {
      const result = await request< { user: UserRecord } >( '/auth/me' );
      setUser( result.user );
    } catch ( err ) {
      if ( err instanceof ApiError && err.status === 401 ) setUser( null );
      else setError( 'Could not verify session. Please check your connection.' );
    } finally {
      setLoading( false );
    }
  }, [ request, token ] );


  useEffect( () => void refreshSession(), [ refreshSession ] );

  useEffect( () => {
    let active = true;

    request< ApiEnv >( '/auth/env' )
      .then( result => { if ( active ) setEnv( result ) } )
      .catch( () => { if ( active ) setEnv( null ) } );

    return () => { active = false };
  }, [ request ] );


  const login = useCallback( async ( credentials: ApiLogin ) => {
    setLoading( true ), setError( null );

    try {
      const result = await request< AuthResult >( '/auth/login', {
        method: 'POST', body: JSON.stringify( credentials )
      } );

      localStorage.setItem( TOKEN_KEY, result.token );
      setToken( result.token ), setUser( result.user );
    } finally {
      setLoading( false );
    }
  }, [ request ] );

  const logout = useCallback( async () => {
    try { if ( token ) await request( '/auth/logout', { method: 'POST' } ) }
    finally {
      localStorage.removeItem( TOKEN_KEY );
      setToken( null ), setUser( null );
    }
  }, [ request, token ] );


  const clearError = useCallback( () => setError( null ), [] );
  const e = encodeURIComponent;
  const s = JSON.stringify;


  const api = useMemo< Api >( () => ( {
    request, login, logout, refreshSession, clearError, health: () => request( '/health' ),

    persons: {
      list: () => request< PersonRecord[] >( '/person' ),
      create: data => request< PersonRecord >( '/person', { method: 'POST', body: s( data ) } ),
      get: id => request< PersonRecord >( `/person/${ e( id ) }` ),
      update: ( id, data ) => request< PersonRecord >( `/person/${ e( id ) }`, { method: 'PATCH', body: s( data ) } ),
      delete: id => request( `/person/${ e( id ) }`, { method: 'DELETE' } )
    },

    portfolios: {
      list: () => request< PortfolioRecord[] >( '/portfolio' ),
      create: data => request< PortfolioRecord >( '/portfolio', { method: 'POST', body: s( data ) } ),
      get: id => request< PortfolioRecord >( `/portfolio/${ e( id ) }` ),
      update: ( id, data ) => request< PortfolioRecord >( `/portfolio/${ e( id ) }`, { method: 'PATCH', body: s( data ) } ),
      delete: id => request( `/portfolio/${ e( id ) }`, { method: 'DELETE' } ),
      members: id => request< PortfolioMemberRecord[] >( `/portfolio/${ e( id ) }/members` ),
      addMember: ( id, userId, role ) => request< PortfolioMemberRecord >( `/portfolio/${ e( id ) }/members`, {
        method: 'POST', body: s( { userId, role } )
      } ),
      updateMember: ( id, memberId, role ) => request< PortfolioMemberRecord >(
        `/portfolio/${ e( id ) }/members/${ e( memberId ) }`, { method: 'PATCH', body: s( { role } ) }
      ),
      removeMember: ( id, memberId ) => request( `/portfolio/${ e( id ) }/members/${ e( memberId ) }`, { method: 'DELETE' } )
    },

    assets: {
      list: portfolioId => request< AssetRecord[] >( `/asset/portfolio/${ e( portfolioId ) }` ),
      create: ( portfolioId, data ) => request< AssetRecord >( `/asset/portfolio/${ e( portfolioId ) }`, {
        method: 'POST', body: s( data )
      } ),
      get: id => request< AssetRecord >( `/asset/${ e( id ) }` ),
      update: ( id, data ) => request< AssetRecord >( `/asset/${ e( id ) }`, { method: 'PATCH', body: s( data ) } ),
      delete: id => request( `/asset/${ e( id ) }`, { method: 'DELETE' } )
    },

    bookings: {
      list: assetId => request< BookingRecord[] >( `/booking/asset/${ e( assetId ) }` ),
      listByPortfolio: portfolioId => request< BookingRecord[] >( `/booking/portfolio/${ e( portfolioId ) }` ),
      create: data => request< BookingRecord >( '/booking', { method: 'POST', body: s( data ) } ),
      get: id => request< BookingRecord >( `/booking/${ e( id ) }` ),
      update: ( id, data ) => request< BookingRecord >( `/booking/${ e( id ) }`, { method: 'PATCH', body: s( data ) } ),
      delete: id => request( `/booking/${ e( id ) }`, { method: 'DELETE' } )
    },

    transactions: {
      list: portfolioId => request< TransactionRecord[] >( `/transaction/portfolio/${ e( portfolioId ) }` ),
      create: ( portfolioId, data ) => request< TransactionRecord >( `/transaction/portfolio/${ e( portfolioId ) }`, {
        method: 'POST', body: s( data )
      } ),
      get: id => request< TransactionRecord >( `/transaction/${ e( id ) }` ),
      update: ( id, data ) => request< TransactionRecord >( `/transaction/${ e( id ) }`, {
        method: 'PATCH', body: s( data )
      } ),
      delete: id => request( `/transaction/${ e( id ) }`, { method: 'DELETE' } )
    },

    daily: {
      list: assetId => request< DailyValueRecord[] >( `/daily/${ e( assetId ) }` ),
      get: ( assetId, date ) => request< DailyValueRecord >( `/daily/${ e( assetId ) }/${ e( date ) }` )
    },

    stats: {
      asset: assetId => request< YearlyRecord[] >( `/stats/asset/${ e( assetId ) }` ),
      assetYear: ( assetId, year ) => request< YearlyRecord >( `/stats/asset/${ e( assetId ) }/${ year }` ),
      portfolio: portfolioId => request< PortfolioYearlyRecord[] >( `/stats/portfolio/${ e( portfolioId ) }` ),
      portfolioYear: ( portfolioId, year ) => request< PortfolioYearlyRecord >(
        `/stats/portfolio/${ e( portfolioId ) }/${ year }`
      )
    },

    values: () => request< ApiValues >( '/values' )
  } ), [ request, login, logout, refreshSession, clearError ] );

  const value = useMemo< ApiContextValue >( () => ( {
    ...api, env, user, token, loading, error, authenticated: user !== null
  } ), [ api, env, user, token, loading, error ] );


  return (
    <ApiContext.Provider value= { value }>
      { children }
    </ApiContext.Provider>
  );
}


export function useApi () : ApiContextValue {
  const context = useContext( ApiContext );
  if ( ! context ) throw new Error( 'useApi must be used within ApiProvider' );
  return context;
}
