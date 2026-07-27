import { useState } from 'react';
import { LogOut, Sun, Moon, ExternalLink, ChevronDown, PanelLeftClose, PanelLeftOpen, LayoutDashboard, Package, Sparkles, Settings } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_GROUPS: { id: string; label: string; icon: React.ReactNode; ids: string[] }[] = [
  { id: 'gestion', label: 'Gestión', icon: <LayoutDashboard className="h-4 w-4" />, ids: ['dashboard', 'calendar', 'bookings', 'clients', 'waiting'] },
  { id: 'negocio', label: 'Negocio', icon: <Package className="h-4 w-4" />, ids: ['availability', 'services', 'shop'] },
  { id: 'presencia', label: 'Presencia', icon: <Sparkles className="h-4 w-4" />, ids: ['bio', 'landing', 'appearance'] },
  { id: 'sistema', label: 'Sistema', icon: <Settings className="h-4 w-4" />, ids: ['integrations', 'payments', 'profile', 'whatsapp', 'trash'] },
];

interface AdminSidebarProps {
  navItems: NavItem[];
  currentView: string;
  onNavigate: (view: string) => void;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
  adminName: string;
  adminAvatar: string;
  adminEmail: string;
  businessName: string;
  businessSlug: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export function AdminSidebar({
  navItems,
  currentView,
  onNavigate,
  sidebarOpen,
  onSidebarClose,
  adminName,
  adminAvatar,
  adminEmail,
  businessName,
  businessSlug,
  darkMode,
  onToggleDarkMode,
  onLogout,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    gestion: true,
    negocio: true,
    presencia: true,
    sistema: true,
  });

  const toggleGroup = (id: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups(prev => ({ ...prev, [id]: true }));
      return;
    }
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getItemById = (id: string) => navItems.find(item => item.id === id);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onSidebarClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
        {/* Header */}
        <div className="flex items-center border-b border-border h-16 px-5 gap-3">
          <Avatar
            fallback={adminName.charAt(0).toUpperCase() || 'A'}
            src={adminAvatar || null}
            className={cn('h-9 w-9 rounded-full shrink-0', collapsed && 'h-8 w-8')}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-base font-display leading-tight block truncate">{businessName || 'Reserva Única'}</span>
              <span className="text-xs text-muted-foreground truncate block mt-0.5">{adminName || adminEmail}</span>
            </div>
          )}
        </div>

        {/* Toggle collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-8 border-b border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors duration-200"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {NAV_GROUPS.map(group => {
            const isOpen = openGroups[group.id];
            const hasActive = group.ids.some(id => currentView === id);
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  title={collapsed ? group.label : undefined}
                  className={cn(
                    'flex w-full items-center rounded-2xl text-base font-display transition-all duration-200',
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
                    hasActive && isOpen
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  {group.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )} />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-3 mt-1 space-y-0.5">
                    {group.ids.map(id => {
                      const item = getItemById(id);
                      if (!item) return null;
                      const isActive = currentView === id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { onNavigate(item.id); onSidebarClose(); }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-base font-display transition-all duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          )}>
                          {item.icon}
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className={cn(
                              'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium min-w-[20px]',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Link a Booking Page */}
        {!collapsed ? (
          <div className="border-t border-border px-3 py-2">
            <a
              href={`/${businessSlug || '...'}/reservas`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-base font-display text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground"
              onClick={onSidebarClose}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Página de reserva</span>
            </a>
          </div>
        ) : (
          <div className="border-t border-border px-3 py-2">
            <a
              href={`/${businessSlug || '...'}/reservas`}
              target="_blank"
              rel="noopener noreferrer"
              title="Página de reserva"
              className="flex items-center justify-center rounded-2xl px-2 py-3 text-base font-display text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground"
              onClick={onSidebarClose}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-1">
          <button
            onClick={onToggleDarkMode}
            title={collapsed ? (darkMode ? 'Modo claro' : 'Modo oscuro') : undefined}
            className={cn(
              'flex w-full items-center rounded-2xl text-base font-display text-muted-foreground transition-colors duration-200 hover:bg-muted/40 hover:text-foreground',
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
            )}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>
          <button
            onClick={onLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'flex w-full items-center rounded-2xl text-base font-display text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive',
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
            )}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>

        {/* Branding */}
        {!collapsed && (
          <div className="border-t border-border px-3 py-3 text-center">
            <span className="text-xs text-gray-500 font-bold">by bookingBio</span>
          </div>
        )}
      </aside>
    </>
  );
}
