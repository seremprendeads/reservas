import { Input } from '../../../../components/ui/input';
import type { LandingSections } from '../../types';

interface MapTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function MapTab({ sections, updateSection }: MapTabProps) {
  const m = sections.map;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Dirección del negocio</label>
        <Input value={m.address} onChange={e => updateSection('map', { ...m, address: e.target.value })}
          placeholder="Av. Ejemplo 1234, Buenos Aires" className="mt-1.5 h-12 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1">Se usará para generar el mapa automáticamente</p>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">URL de incrustación del mapa (opcional)</label>
        <Input value={m.map_url} onChange={e => updateSection('map', { ...m, map_url: e.target.value })}
          placeholder="https://www.google.com/maps/embed?..." className="mt-1.5 h-12 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1">Pegá el link de Google Maps, la dirección, o el código iframe completo</p>
      </div>
    </div>
  );
}
