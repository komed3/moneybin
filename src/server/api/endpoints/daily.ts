import { DailyValues } from '@/src/server/model/DailyValues';
import { Router } from 'express';


export const daily = Router();


daily.get< { assetId: string } >( '/:assetId', ( req, res ) => res.json(
  DailyValues.list( req.params.assetId, res.locals.user.id )
) );

daily.get< { assetId: string, date: string } >( '/:assetId/:date', ( req, res ) => res.json(
  DailyValues.get( req.params.assetId, res.locals.user.id, req.params.date )
) );
