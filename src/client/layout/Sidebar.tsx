import logo from '@/src/client/assets/logo.svg';
import i18n from '@/src/client/lib/i18n';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeftIcon, LayoutDashboardIcon, PowerIcon, SettingsIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router';


interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


const NAV: [ string, string, LucideIcon ][] = [
  [ 'dashboard', '/', LayoutDashboardIcon ]
] as const;


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

      <nav className= 'flex-1 p-4'>
        { NAV.map( ( [ key, url, Icon ] ) => (
          <NavLink
            key= { key }
            to= { url }
            className= { ( { isActive } ) =>
              'flex items-center gap-3 h-12 bg-slate-100 rounded overflow-hidden ' +
              ( isActive ? 'bg-slate-200' : 'hover:bg-slate-100/70' )
            }
          >
            <Icon size= { 22 } className= 'w-12 shrink-0' />
            <span className= 'truncate text-sm font-medium'>
              { i18n.t( $ => $.nav[ key ] ) }
            </span>
          </NavLink>
        ) ) }
      </nav>

      <div className= 'shrink-0 flex items-center gap-4 h-20 px-4 border-t border-slate-200'>
        <button
          onClick= { () => setSidebarOpen( ! sidebarOpen ) }
          className= 'shrink-0 inline-flex justify-center items-center size-12 bg-slate-100 rounded'
          title= { i18n.t( $ => $.sidebar[ sidebarOpen ? 'collapse' : 'expand' ] ) }
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

        <button
          onClick= { undefined }
          className= 'shrink-0 inline-flex justify-center items-center size-12 bg-slate-100 rounded'
          title= { i18n.t( $ => $.sidebar.logout ) }
        >
          <PowerIcon size= { 22 } />
        </button>

        <Link
          to= '/settings'
          className= 'flex-1 inline-flex items-center gap-3 h-12 px-4 bg-slate-100 rounded'
        >
          <SettingsIcon size= { 22 } />
          <span className= 'text-sm font-medium'>
            { i18n.t( $ => $.sidebar.settings ) }
          </span>
        </Link>
      </div>
    </div>
  );
}
