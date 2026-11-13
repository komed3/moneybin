import { Booking } from '@/src/server/model/Booking';
import { Router } from 'express';


export const booking = Router();


booking.get< { assetId: string } >( '/asset/:assetId', ( req, res ) => res.json(
  Booking.list( req.params.assetId, res.locals.user.id )
) );

booking.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Booking.listByPortfolio( req.params.portfolioId, res.locals.user.id )
) );

booking.post( '/', ( req, res ) => {
  const booking = Booking.create( res.locals.user.id, req.body );
  res.status( 201 ).json( booking );
} );

booking.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Booking.getSafe( req.params.id, res.locals.user.id )
) );

booking.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Booking.update( req.params.id, res.locals.user.id, req.body )
) );

booking.delete< { id: string } >( '/:id', ( req, res ) => {
  Booking.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
