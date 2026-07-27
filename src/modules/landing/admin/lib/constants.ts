import {
  Sparkles, Info, Star, Wrench, Heart, ImageIcon,
  MessageSquare, HelpCircle, MousePointerClick, Phone,
  Settings, Palette, MapPin, AlignLeft, Megaphone, ShoppingBag, Search,
} from 'lucide-react';

export const SECTION_ICONS: Record<string, typeof Sparkles> = {
  Sparkles, Info, Star, Wrench, Heart, ImageIcon,
  MessageSquare, HelpCircle, MousePointerClick, Phone, MapPin, AlignLeft, Megaphone, ShoppingBag, Search,
};

export const LUCIDE_ICON_NAMES = [
  'Star', 'Wrench', 'Palette', 'Zap', 'Shield', 'Clock', 'Heart',
  'Award', 'CheckCircle', 'Globe', 'Phone', 'Mail', 'MapPin',
  'Users', 'TrendingUp', 'Target', 'Smile', 'Coffee', 'BookOpen',
  'Camera', 'Music', 'Scissors', 'Dumbbell', 'Leaf', 'Sun',
  'Moon', 'Droplets', 'Flame', 'Sparkles', 'Crown', 'Gem',
  'Diamond', 'Triangle', 'Circle', 'Square', 'Hexagon', 'Pentagon',
];

export type AdminTab = 'general' | 'menu' | 'hero' | 'about' | 'about_text' | 'main_service' | 'services' | 'why' | 'gallery' | 'banner' | 'shop_invite' | 'testimonials' | 'faq' | 'cta' | 'map' | 'popup' | 'seo_marketing' | 'footer' | 'design';

export const ADMIN_TABS: { id: AdminTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'menu', label: 'Menú', icon: Settings },
  { id: 'hero', label: 'Hero', icon: Sparkles },
  { id: 'about', label: 'Nosotros', icon: Info },
  { id: 'about_text', label: 'Texto Nosotros', icon: AlignLeft },
  { id: 'main_service', label: 'Servicio Principal', icon: Star },
  { id: 'services', label: 'Servicios', icon: Wrench },
  { id: 'why', label: 'Por Qué Elegirnos', icon: Heart },
  { id: 'gallery', label: 'Galería', icon: ImageIcon },
  { id: 'banner', label: 'Banner', icon: ImageIcon },
  { id: 'shop_invite', label: 'Invitación Tienda', icon: ShoppingBag },
  { id: 'testimonials', label: 'Testimonios', icon: MessageSquare },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'cta', label: 'CTA', icon: MousePointerClick },
  { id: 'map', label: 'Mapa', icon: MapPin },
  { id: 'popup', label: 'Popup Marketing', icon: Megaphone },
  { id: 'seo_marketing', label: 'SEO Marketing', icon: Search },
  { id: 'footer', label: 'Footer', icon: Phone },
  { id: 'design', label: 'Diseño', icon: Palette },
];
