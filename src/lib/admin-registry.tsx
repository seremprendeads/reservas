import React from 'react';
import { ShoppingCart, Link, Sparkles, CreditCard, Tag } from 'lucide-react';
import type { View } from '../pages/admin/types';
import { BioAdmin } from '../modules/bio/admin/BioAdmin';
import { LandingAdmin } from '../modules/landing/admin/LandingAdmin';
import { ShopAdmin } from '../modules/shop/admin/ShopAdmin';
import { PaymentsAdmin } from '../modules/payments/admin/PaymentsAdmin';
import { PromotionsAdmin } from '../modules/promotions/admin/PromotionsAdmin';

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
    navLabel: 'Tienda Simple',
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
    navLabel: 'Constructor de sitio web',
    navIcon: <Sparkles className="h-5 w-5" />,
    viewTitle: 'Constructor de sitio web',
    navPosition: 9,
  },
  {
    id: 'promotions',
    component: PromotionsAdmin,
    navLabel: 'Promociones y ofertas',
    navIcon: <Tag className="h-5 w-5" />,
    viewTitle: 'Promociones y ofertas',
    navPosition: 7.5,
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
