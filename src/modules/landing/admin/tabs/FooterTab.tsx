import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface FooterTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function FooterTab({ sections, updateSection }: FooterTabProps) {
  const f = sections.footer;
  const update = (field: string, value: string) => updateSection('footer', { ...f, [field]: value });
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título del logo (Footer)</label>
        <Input value={f.logo_title} onChange={e => update('logo_title', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Nombre del negocio" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción del logo (Footer)</label>
        <Input value={f.logo_description} onChange={e => update('logo_description', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Subtítulo o descripción" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Frase / Descripción</label>
        <textarea value={f.frases} onChange={e => update('frases', e.target.value)} rows={3}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
          placeholder="Escribí una frase, eslogan o descripción breve..." />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">Dirección</label>
        <Input value={f.address} onChange={e => update('address', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Av. Ejemplo 1234" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">Teléfono</label>
          <Input value={f.phone} onChange={e => update('phone', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="+54 11 1234-5678" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input value={f.email} onChange={e => update('email', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="info@tu negocio.com" />
        </div>
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">WhatsApp (botón flotante)</label>
        <Input value={f.whatsapp} onChange={e => update('whatsapp', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="+54 11 1234-5678" />
      </div>
      <Separator />
      <p className="text-sm font-medium text-foreground">Redes sociales</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">Instagram</label>
          <Input value={f.instagram} onChange={e => update('instagram', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Facebook</label>
          <Input value={f.facebook} onChange={e => update('facebook', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="URL de Facebook" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">TikTok</label>
          <Input value={f.tiktok} onChange={e => update('tiktok', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">X (Twitter)</label>
          <Input value={f.x} onChange={e => update('x', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">LinkedIn</label>
          <Input value={f.linkedin} onChange={e => update('linkedin', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="URL o usuario" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">YouTube</label>
          <Input value={f.youtube} onChange={e => update('youtube', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tucanal" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Copyright</label>
        <Input value={f.copyright} onChange={e => update('copyright', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="© 2026 Tu Negocio. Todos los derechos reservados." />
      </div>
    </div>
  );
}
