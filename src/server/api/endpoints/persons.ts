import { Person } from '@/src/server/model/Person';
import type { PersonCreateData, PersonUpdateData } from '@/src/shared/types/person';
import { Router } from 'express';


export const persons = Router();


persons.get( '/', ( _, res ) => res.json( Person.list( res.locals.user.id ) ) );

persons.post( '/', ( req, res ) => {
  const person = Person.create( res.locals.user.id, req.body as PersonCreateData );
  res.status( 201 ).json( person );
} );
