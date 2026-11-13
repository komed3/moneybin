import { Asset } from '@/src/server/model/Asset';
import { Router } from 'express';


export const asset = Router();


asset.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Asset.list( req.params.portfolioId, res.locals.user.id )
) );

asset.post< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => {
  const asset = Asset.create( req.params.portfolioId, res.locals.user.id, req.body );
  res.status( 201 ).json( asset );
} );

asset.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Asset.getSafe( req.params.id, res.locals.user.id )
) );
