import { Stats } from '@/src/server/model/Stats';
import { Router } from 'express';


export const stats = Router();


stats.get< { assetId: string } >( '/asset/:assetId', ( req, res ) => res.json(
  Stats.listAsset( req.params.assetId, res.locals.user.id )
) );

stats.get< { assetId: string, year: string } >( '/asset/:assetId/:year', ( req, res ) => res.json(
  Stats.getAssetYear( req.params.assetId, parseInt( req.params.year ), res.locals.user.id )
) );

stats.get< { portfolioId: string } >( '/portfolio/:portfolioId', ( req, res ) => res.json(
  Stats.listPortfolio( req.params.portfolioId, res.locals.user.id )
) );

stats.get< { portfolioId: string, year: string } >( '/portfolio/:portfolioId/:year', ( req, res ) => res.json(
  Stats.getPortfolioYear( req.params.portfolioId, parseInt( req.params.year ), res.locals.user.id )
) );
