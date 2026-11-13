import { asset } from '@/src/server/api/endpoints/asset';
import { auth } from '@/src/server/api/endpoints/auth';
import { booking } from '@/src/server/api/endpoints/booking';
import { daily } from '@/src/server/api/endpoints/daily';
import { person } from '@/src/server/api/endpoints/person';
import { portfolio } from '@/src/server/api/endpoints/portfolio';
import { stats } from '@/src/server/api/endpoints/stats';
import { transaction } from '@/src/server/api/endpoints/transaction';
import { values } from '@/src/server/api/endpoints/values';
import { errorHandler, requireAuth } from '@/src/server/api/middleware';
import { Router } from 'express';


export const api = Router();


api.get( '/health', ( _, res ) => res.json( { status: 'ok' } ) );
api.use( '/auth', auth );

api.use( requireAuth );
api.use( '/person', person );
api.use( '/portfolio', portfolio );
api.use( '/asset', asset );
api.use( '/booking', booking );
api.use( '/transaction', transaction );
api.use( '/daily', daily );
api.use( '/stats', stats );
api.use( '/values', values );

api.use( ( _, res ) => res.status( 404 ).json( { error: 'API endpoint not found' } ) );
api.use( errorHandler );
