import { Footer } from '@/src/client/layout/Footer';
import { Sidebar } from '@/src/client/layout/Sidebar';
import { Routing } from '@/src/client/Routing';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';


export function App () {
  const { pathname } = useLocation();
  useEffect( () => void window.scrollTo( 0, 0 ), [ pathname ] );

  const [ sidebarOpen, setSidebarOpen ] = useState( true );


  return (
    <div className= 'w-screen h-screen overflow-hidden'>
      <Sidebar />

      <main
        key= { pathname }
        className= {
          'h-screen overflow-x-hidden overflow-y-scroll transition-all duration-100 ease-out ' +
          ( sidebarOpen ? 'pl-100' : 'pl-12' )
        }
      >
        <Routing />
        <Footer />
      </main>
    </div>
  );
}
