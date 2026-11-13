import { Portfolio } from '@/src/server/model/Portfolio';
import { Router } from 'express';


export const portfolio = Router();


portfolio.get( '/', ( _, res ) => res.json( Portfolio.list( res.locals.user.id ) ) );

portfolio.post( '/', ( req, res ) => {
  const portfolio = Portfolio.create( res.locals.user.id, req.body );
  res.status( 201 ).json( portfolio );
} );

portfolio.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Portfolio.get( req.params.id, res.locals.user.id )
) );

portfolio.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Portfolio.update( req.params.id, res.locals.user.id, req.body )
) );

portfolio.delete< { id: string } >( '/:id', ( req, res ) => {
  Portfolio.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
