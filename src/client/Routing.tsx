import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';


const modules = import.meta.glob< Record< string, React.ComponentType > >(
  [ './views/*.tsx', '!./views/Login.tsx' ]
);

const view = ( name: string ) => lazy( () =>
  modules[ `./views/${ name }.tsx` ]().then( m => ( { default: m[ name ] } ) )
);


export function Routing () {
  return (
    <Suspense fallback= { <></> }>
      <Routes>
        <Route path= '/' element= { <></> } />
      </Routes>
    </Suspense>
  );
}
