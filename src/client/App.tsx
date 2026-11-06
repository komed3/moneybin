import { Routing } from '@/src/client/Routing';
import { useEffect } from 'react';
import { useLocation } from 'react-router';


export function App () {
  const { pathname } = useLocation();
  useEffect( () => void window.scrollTo( 0, 0 ), [ pathname ] );


  return (
    <>
      <main key= { pathname }>
        <Routing />
      </main>
    </>
  );
}
