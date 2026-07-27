import React from 'react';

export type View = 'dashboard' | 'bookings' | 'availability' | 'detail' | 'trash' | 'whatsapp' | 'clients' | 'waiting' | 'profile' | 'appearance' | 'services' | 'shop' | 'bio' | 'payments' | 'landing' | 'calendar' | 'integrations';

export interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}
