import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Check, Loader2, Tag, ImagePlus, X, Link as LinkIcon } from 'lucide-react';
import { authInvoke, describeFunctionError } from '../../../pages/admin/helpers';
import { uploadStorageFile } from '../../../lib/storage-upload';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Promotion, DiscountType, AppliesTo, APPLIES_LABEL, discountLabel } from '../types';

type FormState = {
  id?: string;
  name: string;
  code: string;
  description: string;
  image_url: string;
  discount_type: DiscountType;
  discount_value: string;
  applies_to: AppliesTo;
  min_amount: string;
  max_uses: string;
  starts_date: string;
  ends_date: string;
  is_active: boolean;
  show_in_bio: boolean;
  bio_label: string;
};

const EMPTY: FormState = {
  name: '', code: '', description: '', image_url: '',
  discount_type: 'percent', discount_value: '10', applies_to: 'both',
  min_amount: '', max_uses: '', starts_date: '', ends_date: '',
  is_active: true, show_in_bio: false, bio_label: '',
};

const FIELD = 'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';
const LABEL = 'mb-1.5 block text-xs font-semibold text-muted-foreground';

// Fecha local (YYYY-MM-DD) de un ISO guardado en la base.
const aFechaLocal = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');

function toForm(p: Promotion): FormState {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    description: p.description ?? '',
    image_url: p.image_url ?? '',
    discount_type: p.discount_type,
    discount_value: String(p.discount_value ?? ''),
    applies_to: p.applies_to,
    min_amount: p.min_amount ? String(p.min_amount) : '',
    max_uses: p.max_uses ? String(p.max_uses) : '',
    starts_date: aFechaLocal(p.starts_at),
    ends_date: aFechaLocal(p.ends_at),
    is_active: p.is_active,
    show_in_bio: p.show_in_bio,
    bio_label: p.bio_label ?? '',
  };
}

function compressImage(file: File): Promise<Blob> {
  if (file.size <= 500 * 1024 || file.type === 'image/gif') return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxW = 1200, maxH = 1600;
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      if (h > maxH) { w = w * maxH / h; h = maxH; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const fmt = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Compresión fallida'))), fmt, 0.85);
    };
    img.onerror = () => reject(new Error('Error al leer la imagen'));
    img.src = url;
  });
}

export function PromotionsAdmin() {
  const { business } = useBusiness();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [hasBioProfile, setHasBioProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await authInvoke('admin-manage-promotions', { action: 'list' });
    if (err || !data?.success) {
      setError(await describeFunctionError(err, 'No se pudieron cargar las promociones'));
    } else {
      setPromos(data.promotions || []);
      setHasBioProfile(!!data.has_bio_profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(''), 3500); };
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => (f ? { ...f, [k]: v } : f));

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : 'jpg';
      const mime = blob.type === 'image/webp' ? 'image/webp' : blob.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
      const url = await uploadStorageFile('branding', `promo-${(business?.id || 'negocio').slice(0, 8)}-${Date.now()}.${ext}`, blob, mime);
      set('image_url', url);
    } catch {
      setError('No se pudo subir la imagen. Intentá de nuevo.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    const promotion = {
      id: form.id,
      name: form.name,
      code: form.code,
      description: form.description,
      image_url: form.image_url || null,
      discount_type: form.discount_type,
      discount_value: form.discount_type === 'free' ? 0 : Number(form.discount_value),
      applies_to: form.applies_to,
      min_amount: Number(form.min_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      starts_at: form.starts_date ? new Date(`${form.starts_date}T00:00:00`).toISOString() : null,
      ends_at: form.ends_date ? new Date(`${form.ends_date}T23:59:59`).toISOString() : null,
      is_active: form.is_active,
      show_in_bio: form.show_in_bio,
      bio_label: form.bio_label,
    };
    const { data, error: err } = await authInvoke('admin-manage-promotions', { action: 'save', promotion });
    setSaving(false);
    if (err || !data?.success) {
      setError(await describeFunctionError(err, 'No se pudo guardar la promoción'));
      return;
    }
    setForm(null);
    await load();
    flash(data.bio_sync === 'no_profile'
      ? 'Promoción guardada. Para verla en la Bio primero creá tu perfil en "Bio links".'
      : 'Promoción guardada');
  };

  const toggle = async (p: Promotion) => {
    const { data, error: err } = await authInvoke('admin-manage-promotions', { action: 'toggle', id: p.id, is_active: !p.is_active });
    if (err || !data?.success) { setError(await describeFunctionError(err, 'No se pudo cambiar el estado')); return; }
    setPromos(prev => prev.map(x => (x.id === p.id ? data.promotion : x)));
  };

  const remove = async (p: Promotion) => {
    if (!window.confirm(`¿Eliminar la promoción "${p.name}"? Los códigos ya emitidos dejan de funcionar.`)) return;
    const { data, error: err } = await authInvoke('admin-manage-promotions', { action: 'delete', id: p.id });
    if (err || !data?.success) { setError(await describeFunctionError(err, 'No se pudo eliminar')); return; }
    setPromos(prev => prev.filter(x => x.id !== p.id));
  };

  const copy = async (p: Promotion) => {
    try {
      await navigator.clipboard.writeText(p.code);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch { /* sin permiso de portapapeles */ }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ------------------------------- Formulario -------------------------------
  if (form) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{form.id ? 'Editar promoción' : 'Nueva promoción'}</h2>
          <Button variant="ghost" size="sm" onClick={() => { setForm(null); setError(''); }}><X className="mr-1 h-4 w-4" />Cancelar</Button>
        </div>

        {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <Card><CardContent className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Nombre (solo para vos)</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Black Friday 2026" maxLength={80} />
            </div>
            <div>
              <label className={LABEL}>Código que pega el cliente</label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="BLACK20" maxLength={30} className="font-mono uppercase" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Tipo de descuento</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {([['percent', 'Porcentaje (%)'], ['fixed', 'Monto fijo ($)'], ['free', 'Gratis (100%)']] as [DiscountType, string][]).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('discount_type', v)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${form.discount_type === v ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-accent'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {form.discount_type !== 'free' && (
            <div className="max-w-xs">
              <label className={LABEL}>{form.discount_type === 'percent' ? 'Porcentaje de descuento (1–100)' : 'Monto a descontar ($)'}</label>
              <Input type="number" min={1} max={form.discount_type === 'percent' ? 100 : undefined} value={form.discount_value} onChange={e => set('discount_value', e.target.value)} />
            </div>
          )}

          <div>
            <label className={LABEL}>Dónde se puede usar</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(APPLIES_LABEL) as AppliesTo[]).map(v => (
                <button key={v} type="button" onClick={() => set('applies_to', v)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${form.applies_to === v ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-accent'}`}>
                  {APPLIES_LABEL[v]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Tienda: se pega en el total del carrito. Reservas: se pega antes de pagar la reserva o la seña.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={LABEL}>Válida desde (opcional)</label><input type="date" className={FIELD} value={form.starts_date} onChange={e => set('starts_date', e.target.value)} /></div>
            <div><label className={LABEL}>Válida hasta (opcional)</label><input type="date" className={FIELD} value={form.ends_date} onChange={e => set('ends_date', e.target.value)} /></div>
            <div><label className={LABEL}>Compra mínima $ (opcional)</label><Input type="number" min={0} value={form.min_amount} onChange={e => set('min_amount', e.target.value)} placeholder="Sin mínimo" /></div>
            <div><label className={LABEL}>Límite de usos (opcional)</label><Input type="number" min={1} value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Ilimitado" /></div>
          </div>

          <div>
            <label className={LABEL}>Descripción (opcional)</label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} maxLength={300} placeholder="Ej: 20% en toda la tienda hasta el domingo" />
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 font-bold text-foreground"><LinkIcon className="h-4 w-4 text-primary" />Mostrar en la Bio</div>
          <p className="text-sm text-muted-foreground">Aparece como un botón desplegable en tu Bio con la imagen de la promoción y el código para copiar. Solo una promoción a la vez puede estar en la Bio.</p>

          <div className="flex items-start gap-4">
            <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-muted/40">
              {form.image_url ? <img src={form.image_url} alt="Promoción" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
                {form.image_url ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              {form.image_url && <button type="button" className="block text-xs text-destructive hover:underline" onClick={() => set('image_url', '')}>Quitar imagen</button>}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.show_in_bio} onChange={e => set('show_in_bio', e.target.checked)} />
            <span className="text-sm font-medium text-foreground">Mostrar esta promoción en mi Bio</span>
          </label>
          {form.show_in_bio && (
            <div className="max-w-sm">
              <label className={LABEL}>Texto del botón</label>
              <Input value={form.bio_label} onChange={e => set('bio_label', e.target.value)} placeholder="Promociones y descuentos" maxLength={60} />
            </div>
          )}
          {form.show_in_bio && !hasBioProfile && (
            <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Todavía no creaste tu perfil de Bio. Guardá la promoción y creá el perfil en "Bio links" para que se vea.</p>
          )}
        </CardContent></Card>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            <span className="text-sm font-medium text-foreground">Promoción activa</span>
          </label>
          <Button onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar promoción
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------- Lista ---------------------------------
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Promociones y ofertas</h2>
          <p className="text-sm text-muted-foreground">Creá códigos de descuento que tus clientes pegan en la Tienda o al pagar una reserva.</p>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY }); setError(''); }}><Plus className="mr-1 h-4 w-4" />Nueva promoción</Button>
      </div>

      {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{notice}</p>}

      {promos.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">Todavía no tenés promociones</p>
          <p className="mt-1 text-sm text-muted-foreground">Creá la primera para empezar a ofrecer descuentos.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promos.map(p => {
            const vencida = !!p.ends_at && new Date(p.ends_at).getTime() < Date.now();
            const agotada = p.max_uses !== null && p.uses_count >= p.max_uses;
            return (
              <Card key={p.id} className={!p.is_active || vencida || agotada ? 'opacity-70' : ''}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Tag className="m-auto mt-5 h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground">{p.name}</span>
                      <Badge variant="default">{discountLabel(p)}</Badge>
                      <Badge variant="secondary">{APPLIES_LABEL[p.applies_to]}</Badge>
                      {p.show_in_bio && <Badge variant="info">En Bio</Badge>}
                      {vencida && <Badge variant="destructive">Vencida</Badge>}
                      {agotada && <Badge variant="warning">Sin usos</Badge>}
                    </div>
                    <button type="button" onClick={() => copy(p)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground hover:bg-accent">
                      {p.code}{copiedId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Usos: {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ''}
                      {p.min_amount > 0 && ` · Mínimo $${Number(p.min_amount).toLocaleString('es-AR')}`}
                      {p.starts_at && ` · Desde ${new Date(p.starts_at).toLocaleDateString('es-AR')}`}
                      {p.ends_at && ` · Hasta ${new Date(p.ends_at).toLocaleDateString('es-AR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={p.is_active} onChange={() => toggle(p)} />Activa
                    </label>
                    <Button variant="outline" size="icon" aria-label="Editar" onClick={() => { setForm(toForm(p)); setError(''); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" aria-label="Eliminar" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
