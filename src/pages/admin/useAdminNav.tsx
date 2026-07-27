import { useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  ClipboardList,
  Package,
  Palette,
  UserCog,
  MessageSquareText,
  Archive,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';
import type { View, NavItem } from './types';
import type { WaitingListItem, Booking } from '../../lib/supabase';
import { getModuleNavItems } from '../../lib/admin-registry';
import type { ModuleId } from '../../modules/subscription';

export function useAdminNav(
  waitingList: WaitingListItem[],
  deletedBookings: Booking[],
  enabledModules: ModuleId[] = []
) {
  const moduleNavItems = useMemo(() => getModuleNavItems(), []);

  const navItems: NavItem[] = useMemo(() => {
    const isFreePlan = enabledModules.length === 1 && enabledModules[0] === 'bio';

    const core: NavItem[] = isFreePlan
      ? [
          { id: 'dashboard', label: 'Principal', icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: 'calendar', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
        ]
      : [
          { id: 'dashboard', label: 'Principal', icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: 'calendar', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
          { id: 'bookings', label: 'Reservas', icon: <CalendarDays className="h-5 w-5" /> },
          { id: 'clients', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
          {
            id: 'waiting', label: 'Lista de espera', icon: <ClipboardList className="h-5 w-5" />,
            badge: waitingList.filter(w => w.estado === 'pendiente').length || undefined,
          },
          { id: 'availability', label: 'Disponibilidad', icon: <Clock className="h-5 w-5" /> },
          { id: 'services', label: 'Servicios', icon: <Package className="h-5 w-5" /> },
        ];

    const moduleViewToModuleId: Record<string, ModuleId> = {
      shop: 'shop',
      bio: 'bio',
      landing: 'landing',
      payments: 'shop',
    };

    const modules: NavItem[] = moduleNavItems
      .filter(m => {
        const requiredModule = moduleViewToModuleId[m.id];
        if (!requiredModule) return true;
        return enabledModules.includes(requiredModule);
      })
      .map(m => ({
        id: m.id,
        label: m.navLabel,
        icon: m.navIcon,
      }));

    const tail: NavItem[] = isFreePlan
      ? [
          { id: 'profile', label: 'Configuración de Cuenta', icon: <UserCog className="h-5 w-5" /> },
        ]
      : [
          { id: 'appearance', label: 'Apariencia Reservas', icon: <Palette className="h-5 w-5" /> },
          { id: 'profile', label: 'Perfil', icon: <UserCog className="h-5 w-5" /> },
          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquareText className="h-5 w-5" /> },
          {
            id: 'trash', label: 'Papelera', icon: <Archive className="h-5 w-5" />,
            badge: deletedBookings.length || undefined,
          },
        ];

    return [...core, ...modules, ...tail];
  }, [waitingList, deletedBookings, moduleNavItems, enabledModules]);

  const coreTitles: Record<string, string> = {
    dashboard: 'Panel Principal',
    calendar: 'Calendario',
    bookings: 'Reservas',
    clients: 'Clientes',
    waiting: 'Lista de Espera',
    availability: 'Disponibilidad',
    services: 'Servicios',
    appearance: 'Apariencia Reservas',
    payments: 'Pagos',
    profile: 'Perfil',
    whatsapp: 'WhatsApp',
    trash: 'Papelera',
    detail: 'Detalle de Reserva',
  };

  const viewTitles: Record<View, string> = useMemo(() => {
    const titles = { ...coreTitles };
    for (const m of moduleNavItems) {
      titles[m.id] = m.viewTitle;
    }
    return titles as Record<View, string>;
  }, [moduleNavItems]);

  return { navItems, viewTitles };
}
