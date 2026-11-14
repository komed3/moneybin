import logo from '@/src/client/assets/logo.svg';
import i18n from '@/src/client/lib/i18n';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeftIcon, LayoutDashboardIcon, PowerIcon, SettingsIcon, Table2Icon, WalletCardsIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router';


interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


const NAV: [ string, string, LucideIcon ][] = [
  [ 'dashboard', '/', LayoutDashboardIcon ],
  [ 'assets', '/assets', WalletCardsIcon ],
  [ 'bookings', '/bookings', Table2Icon ]
] as const;

const BTN = ( active = false ) =>
  'shrink-0 flex items-center h-12 bg-slate-100 rounded-md overflow-hidden transition-colors ' +
  'duration-100 ease-out ' + ( active ? 'text-white bg-theme' : 'hover:bg-slate-200' );


export function Sidebar ( { sidebarOpen, setSidebarOpen }: SidebarProps ) {
  return (
    <div
      className= {
        'z-40 flex flex-col h-full whitespace-nowrap bg-white border-r border-slate-200 overflow-hidden ' +
        'shadow-md transition-all duration-100 ease-out ' + ( sidebarOpen ? 'w-80' : 'w-20' )
      }
    >
      <div className= 'shrink-0 flex items-center gap-4 h-20 px-4 border-b border-slate-200'>
        <img
          src= { logo }
          className= 'shrink-0 size-12'
          loading= 'lazy'
          alt= ''
        />

        <h1 className= 'truncate text-xl font-semibold tracking-tight'>
          MoneyBin
        </h1>
      </div>

      <nav className= 'flex-1 p-4 space-y-2'>
        { NAV.map( ( [ key, url, Icon ] ) => (
          <NavLink
            key= { key }
            to= { url }
            className= { ( { isActive } ) => BTN( isActive ) }
          >
            <Icon size= { 24 } className= 'w-12 shrink-0' />
            <span className= 'truncate text-[15px] font-medium'>
              { i18n.t( $ => $.nav[ key ] ) }
            </span>
          </NavLink>
        ) ) }
      </nav>

      <div className= 'shrink-0 flex items-center gap-4 h-20 px-4 border-t border-slate-200'>
        <button
          onClick= { () => setSidebarOpen( ! sidebarOpen ) }
          className= { BTN() + ' justify-center size-12' }
          title= { i18n.t( $ => $.sidebar[ sidebarOpen ? 'collapse' : 'expand' ] ) }
        >
          <ChevronLeftIcon
            size= { 34 }
            strokeWidth= { 1.4 }
            className= {
              'transition-transform duration-100 ease-out ' +
              ( sidebarOpen ? 'rotate-0' : 'rotate-180' )
            }
          />
        </button>

        <button
          onClick= { undefined }
          className= { BTN() + ' justify-center size-12' }
          title= { i18n.t( $ => $.sidebar.logout ) }
        >
          <PowerIcon size= { 24 } />
        </button>

        <Link
          to= '/settings'
          className= { BTN() + ' flex-1 justify-center gap-3 pr-2' }
        >
          <SettingsIcon size= { 24 } className= 'shrink-0' />
          <span className= 'text-[15px] font-medium'>
            { i18n.t( $ => $.sidebar.settings ) }
          </span>
        </Link>
      </div>
    </div>
  );
}
