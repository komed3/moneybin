import logo from '@/src/client/assets/logo.svg';


interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


export function Sidebar ( { sidebarOpen, setSidebarOpen }: SidebarProps ) {
  return (
    <div
      className= {
        'z-40 flex flex-col h-full whitespace-nowrap bg-white border-r border-slate-200 ' +
        'overflow-hidden shadow-md ' + ( sidebarOpen ? 'w-95' : 'w-20' )
      }
    >
      <div className= 'shrink-0 flex items-center gap-4 h-20 px-6 border-b border-slate-200'>
        <img
          src= { logo }
          className= 'size-9'
          loading= 'lazy'
          alt= ''
        />

        <h1 className= 'truncate text-xl font-semibold tracking-tight'>
          MoneyBin
        </h1>
      </div>
    </div>
  );
}
