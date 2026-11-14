import logo from '@/src/client/assets/logo.svg';
import i18n from '@/src/client/lib/i18n';
import { ChevronLeftIcon } from 'lucide-react';


interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


export function Sidebar ( { sidebarOpen, setSidebarOpen }: SidebarProps ) {
  return (
    <div
      className= {
        'z-40 flex flex-col h-full whitespace-nowrap bg-white border-r border-slate-200 overflow-hidden ' +
        'shadow-md transition-all duration-100 ease-out ' + ( sidebarOpen ? 'w-95' : 'w-20' )
      }
    >
      <div className= 'shrink-0 flex items-center gap-5 h-20 px-5 border-b border-slate-200'>
        <img
          src= { logo }
          className= 'shrink-0 size-10'
          loading= 'lazy'
          alt= ''
        />

        <h1 className= 'truncate text-xl font-semibold tracking-tight'>
          MoneyBin
        </h1>
      </div>

      <div className= 'flex-1' />

      <div className= 'shrink-0 flex items-center gap-4 h-20 px-5 border-t border-slate-200'>
        <button
          onClick= { () => setSidebarOpen( ! sidebarOpen ) }
          className= 'inline-flex justify-center items-center size-10 bg-slate-100 rounded'
        >
          <ChevronLeftIcon
            size= { 28 }
            strokeWidth= { 1.4 }
            className= {
              'transition-transform duration-100 ease-out ' +
              ( sidebarOpen ? 'rotate-0' : 'rotate-180' )
            }
          />
        </button>
      </div>
    </div>
  );
}
