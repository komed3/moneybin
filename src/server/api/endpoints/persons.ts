import { Person } from '@/src/server/model/Person';
import { Router } from 'express';


export const persons = Router();


persons.get( '/', ( _, res ) => res.json( Person.list( res.locals.user.id ) ) );

persons.post( '/', ( req, res ) => {
  const person = Person.create( res.locals.user.id, req.body );
  res.status( 201 ).json( person );
} );

persons.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Person.getSafe( req.params.id, res.locals.user.id )
) );

persons.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Person.update( req.params.id, res.locals.user.id, req.body )
) );

persons.delete< { id: string } >( '/:id', ( req, res ) => {
  Person.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
