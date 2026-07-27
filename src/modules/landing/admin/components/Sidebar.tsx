import { ChevronDown, PanelLeftClose, PanelLeftOpen, Sparkles, Heart, Settings } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { ADMIN_TABS, type AdminTab } from '../lib/constants';

interface SidebarProps {
  activeTab: AdminTab | null;
  setActiveTab: (tab: AdminTab | null) => void;
  panelCollapsed: boolean;
  setPanelCollapsed: (v: boolean) => void;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const SIDEBAR_GROUPS = [
  { id: 'secciones', label: 'Secciones', icon: Sparkles, tabs: ['hero', 'about', 'about_text', 'main_service', 'services', 'why'] as AdminTab[] },
  { id: 'engagement', label: 'Engagement', icon: Heart, tabs: ['gallery', 'banner', 'shop_invite', 'testimonials', 'faq', 'cta', 'map', 'popup'] as AdminTab[] },
  { id: 'config', label: 'Configuración', icon: Settings, tabs: ['general', 'menu', 'design', 'seo_marketing', 'footer'] as AdminTab[] },
];

export function Sidebar({ activeTab, setActiveTab, panelCollapsed, setPanelCollapsed, openGroups, setOpenGroups }: SidebarProps) {
  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={panelCollapsed ? 'w-[68px] shrink-0' : 'w-72 shrink-0'}>
      <Card className="sticky top-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
        <CardContent className="p-3 space-y-1.5">
          <button
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="w-full flex items-center justify-center rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-accent-foreground transition-all duration-200"
            title={panelCollapsed ? 'Expandir panel' : 'Colapsar panel'}
          >
            {panelCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {SIDEBAR_GROUPS.map(group => {
            const isOpen = openGroups[group.id];
            const isActive = activeTab !== null && group.tabs.includes(activeTab);
            const GroupIcon = group.icon;
            return (
              <div key={group.id}>
                <button
                  onClick={() => {
                    if (panelCollapsed) { setPanelCollapsed(false); setOpenGroups(prev => ({ ...prev, [group.id]: true })); return; }
                    toggleGroup(group.id);
                  }}
                  title={panelCollapsed ? group.label : undefined}
                  className={`w-full flex items-center rounded-xl text-base font-display transition-all duration-200 ${
                    panelCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2'
                  } ${
                    isActive && isOpen
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  {!panelCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{group.label}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {!panelCollapsed && isOpen && (
                  <div className="ml-3 border-l pl-3 mt-1 mb-2 space-y-1">
                    {group.tabs.map(tabId => {
                      const tab = ADMIN_TABS.find(t => t.id === tabId)!;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tabId}
                          onClick={() => setActiveTab(tabId)}
                          className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-base font-display transition-all duration-200 ${
                            activeTab === tabId
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
