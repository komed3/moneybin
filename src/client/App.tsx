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
      <Sidebar { ...{ sidebarOpen, setSidebarOpen } } />

      <main
        key= { pathname }
        className= {
          'h-screen overflow-x-hidden overflow-y-scroll transition-all duration-100 ease-out ' +
          ( sidebarOpen ? 'ml-95' : 'ml-20' )
        }
      >
        <Routing />
        <Footer />
      </main>
    </div>
  );
}
