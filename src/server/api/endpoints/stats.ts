import { Stats } from '@/src/server/model/Stats';
import { Router } from 'express';


export const stats = Router();


stats.get< { assetId: string } >( '/asset/:assetId', ( req, res ) => res.json(
  Stats.listAsset( req.params.assetId, res.locals.user.id )
) );

stats.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Stats.listPortfolio( req.params.portfolioId, res.locals.user.id )
) );
