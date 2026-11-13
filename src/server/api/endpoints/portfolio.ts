import { Portfolio } from '@/src/server/model/Portfolio';
import { Router } from 'express';


export const portfolio = Router();


portfolio.get( '/', ( _, res ) => res.json( Portfolio.list( res.locals.user.id ) ) );

portfolio.post( '/', ( req, res ) => {
  const portfolio = Portfolio.create( res.locals.user.id, req.body );
  res.status( 201 ).json( portfolio );
} );
