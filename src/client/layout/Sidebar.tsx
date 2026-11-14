import logo from '@/src/client/assets/logo.svg';
import { useApi } from '@/src/client/context/ApiContext';
import { useI18n } from '@/src/client/hooks/useI18n';
import type { Translations } from '@/src/shared/types/i18n';
import type { LucideIcon } from 'lucide-react';
import {
  BracesIcon, ChartColumnIcon, ChartPieIcon, ChevronLeftIcon, LayoutDashboardIcon,
  PowerIcon, SettingsIcon, Table2Icon, UserIcon, WalletCardsIcon
} from 'lucide-react';
import { NavLink } from 'react-router';


interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


const NAV: [ keyof Translations[ 'nav' ], string, LucideIcon ][] = [
  [ 'dashboard', '/', LayoutDashboardIcon ], [ 'momentum', '/momentum', ChartColumnIcon ],
  [ 'assets', '/assets', WalletCardsIcon ], [ 'breakdown', '/breakdown', ChartPieIcon ],
  [ 'bookings', '/bookings', Table2Icon ], [ 'editor', '/editor', BracesIcon ]
];

const BTN = ( active = false ) =>
  'shrink-0 flex items-center h-12 rounded-md overflow-hidden transition-colors ' +
  'duration-100 ease-out ' + ( active ? 'text-white bg-theme' : 'hover:bg-slate-200' );


export function Sidebar ( { sidebarOpen, setSidebarOpen }: SidebarProps ) {
  const { env } = useApi();
  const t = useI18n();

  const appName = env?.appName ?? 'MoneyBin';


  return (
    <div
      className= {
        'z-40 flex flex-col h-full whitespace-nowrap bg-white border-r border-slate-200 overflow-hidden ' +
        'shadow-md transition-all duration-100 ease-out ' + ( sidebarOpen ? 'w-80' : 'w-20' )
      }
    >
      <div className= 'shrink-0 flex items-center gap-4 h-20 px-5 border-b border-slate-200'>
        <img
          src= { logo }
          className= 'shrink-0 size-10'
          loading= 'lazy'
          alt= { appName }
        />

        <h1 className= 'truncate text-xl font-semibold tracking-tight'>
          { appName }
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
              { t.nav[ key ] }
            </span>
          </NavLink>
        ) ) }
      </nav>

      <div className= 'shrink-0 flex items-center gap-2 h-20 px-4 border-t border-slate-200'>
        <button
          onClick= { () => setSidebarOpen( ! sidebarOpen ) }
          className= { BTN() + ' justify-center size-12 bg-slate-50' }
          title= { t.sidebar[ sidebarOpen ? 'collapse' : 'expand' ] }
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

        <div className= 'flex-1' />

        <button
          onClick= { undefined }
          className= { BTN() + ' justify-center size-12 bg-slate-50' }
          title= { t.sidebar.logout }
        >
          <UserIcon size= { 24 } />
        </button>

        <button
          onClick= { undefined }
          className= { BTN() + ' justify-center size-12 bg-slate-50' }
          title= { t.sidebar.logout }
        >
          <SettingsIcon size= { 24 } />
        </button>

        <button
          onClick= { undefined }
          className= { BTN() + ' justify-center size-12 bg-slate-50' }
          title= { t.sidebar.logout }
        >
          <PowerIcon size= { 24 } />
        </button>
      </div>
    </div>
  );
}
