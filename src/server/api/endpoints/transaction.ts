import { Transaction } from '@/src/server/model/Transaction';
import type { TransactionCreateData, TransactionUpdateData } from '@/src/shared/types/transaction';
import { Router } from 'express';


export const transactions = Router();


transactions.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Transaction.list( req.params.portfolioId, res.locals.user.id )
) );

transactions.post< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => {
  const transaction = Transaction.create(
    req.params.portfolioId,
    res.locals.user.id,
    req.body as TransactionCreateData
  );

  res.status( 201 ).json( transaction );
} );

transactions.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Transaction.getSafe( req.params.id, res.locals.user.id )
) );

transactions.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Transaction.update( req.params.id, res.locals.user.id, req.body as TransactionUpdateData )
) );

transactions.delete< { id: string } >( '/:id', ( req, res ) => {
  Transaction.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
