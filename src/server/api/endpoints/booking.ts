import { Booking } from '@/src/server/model/Booking';
import { Router } from 'express';


export const booking = Router();


booking.get< { assetId: string } >( '/asset/:assetId', ( req, res ) => res.json(
  Booking.list( req.params.assetId, res.locals.user.id )
) );

booking.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Booking.listByPortfolio( req.params.portfolioId, res.locals.user.id )
) );
