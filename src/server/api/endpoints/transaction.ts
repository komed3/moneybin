import { Transaction } from '@/src/server/model/Transaction';
import { Router } from 'express';


export const transaction = Router();


transaction.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Transaction.list( req.params.portfolioId, res.locals.user.id )
) );

transaction.post< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => {
  const transaction = Transaction.create( req.params.portfolioId, res.locals.user.id, req.body );
  res.status( 201 ).json( transaction );
} );

transaction.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Transaction.getSafe( req.params.id, res.locals.user.id )
) );

transaction.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Transaction.update( req.params.id, res.locals.user.id, req.body )
) );

transaction.delete< { id: string } >( '/:id', ( req, res ) => {
  Transaction.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
