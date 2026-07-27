import { LUCIDE_ICON_NAMES } from '../lib/constants';

const ICON_LABELS: Record<string, string> = {
  Star: 'Estrella',
  Wrench: 'Llave',
  Palette: 'Paleta',
  Zap: 'Rayo',
  Shield: 'Escudo',
  Clock: 'Reloj',
  Heart: 'Corazón',
  Award: 'Premio',
  CheckCircle: 'Check',
  Globe: 'Globo',
  Phone: 'Teléfono',
  Mail: 'Correo',
  MapPin: 'Ubicación',
  Users: 'Personas',
  TrendingUp: 'Tendencia',
  Target: 'Objetivo',
  Smile: 'Sonrisa',
  Coffee: 'Café',
  BookOpen: 'Libro',
  Camera: 'Cámara',
  Music: 'Música',
  Scissors: 'Tijera',
  Dumbbell: 'Mancuerna',
  Leaf: 'Hoja',
  Sun: 'Sol',
  Moon: 'Luna',
  Droplets: 'Gotas',
  Flame: 'Fuego',
  Sparkles: 'Destellos',
  Crown: 'Corona',
  Gem: 'Gema',
  Diamond: 'Diamante',
  Triangle: 'Triángulo',
  Circle: 'Círculo',
  Square: 'Cuadrado',
  Hexagon: 'Hexágono',
  Pentagon: 'Pentágono',
};

interface IconSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {LUCIDE_ICON_NAMES.map(name => <option key={name} value={name}>{ICON_LABELS[name] || name}</option>)}
    </select>
  );
}
