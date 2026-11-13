import { Values } from '@/src/server/core/Values';
import { Router } from 'express';


export const values = Router();


values.get( '/', ( _, res ) => res.json( {
  currencies: Values.currencies, personGenders: Values.personGenders,
  portfolioMemberRoles: Values.portfolioMemberRoles, assetTypes: Values.assetTypes,
  liquidationLevels: Values.liquidationLevels, assetStatuses: Values.assetStatuses,
  bookingTypes: Values.bookingTypes, bookingValueTypes: Values.bookingValueTypes,
  bookingReliabilities: Values.bookingReliabilities
} ) );
