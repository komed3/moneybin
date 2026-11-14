interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: ( value: boolean ) => void;
}


export function Sidebar ( { sidebarOpen, setSidebarOpen }: SidebarProps ) {
  return (
    <div
      className= {
        'flex flex-col h-screen bg-white border-r border-slate-200 ' +
        ( sidebarOpen ? 'w-90' : 'w-12' )
      }
    ></div>
  );
}
