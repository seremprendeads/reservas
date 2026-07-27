import React from 'react';
import { ShoppingCart, Link, Sparkles, CreditCard } from 'lucide-react';
import type { View } from '../pages/admin/types';
import { BioAdmin } from '../modules/bio/admin/BioAdmin';
import { LandingAdmin } from '../modules/landing/admin/LandingAdmin';
import { ShopAdmin } from '../modules/shop/admin/ShopAdmin';
import { PaymentsAdmin } from '../modules/payments/admin/PaymentsAdmin';

export interface AdminModuleEntry {
  id: View;
  component: React.ComponentType<any>;
  navLabel: string;
  navIcon: React.ReactNode;
  viewTitle: string;
  navPosition: number;
}

export const adminModules: AdminModuleEntry[] = [
  {
    id: 'shop',
    component: ShopAdmin,
    navLabel: 'Tienda',
    navIcon: <ShoppingCart className="h-5 w-5" />,
    viewTitle: 'Tienda',
    navPosition: 7,
  },
  {
    id: 'bio',
    component: BioAdmin,
    navLabel: 'Mi Bio',
    navIcon: <Link className="h-5 w-5" />,
    viewTitle: 'Mi Bio',
    navPosition: 8,
  },
  {
    id: 'landing',
    component: LandingAdmin,
    navLabel: 'Landing Page',
    navIcon: <Sparkles className="h-5 w-5" />,
    viewTitle: 'Landing Page',
    navPosition: 9,
  },
  {
    id: 'payments',
    component: PaymentsAdmin,
    navLabel: 'Pagos',
    navIcon: <CreditCard className="h-5 w-5" />,
    viewTitle: 'Pagos',
    navPosition: 11,
  },
];

export function getModuleById(id: View): AdminModuleEntry | undefined {
  return adminModules.find(m => m.id === id);
}

export function getModuleNavItems(): AdminModuleEntry[] {
  return [...adminModules].sort((a, b) => a.navPosition - b.navPosition);
}
