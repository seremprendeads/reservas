import { useState, useEffect } from 'react';
import { ExternalLink, CalendarCheck, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { supabase, Service } from '../../lib/supabase';
import { compressImage } from '../../lib/image-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useBusiness } from '../../contexts/BusinessContext';
import { authInvoke } from './helpers';
import { useImageUpload } from '../../hooks/useImageUpload';

export function ServicesManager() {
  const { business } = useBusiness();
  const { uploading: uploadingImg, imgInputRef, handleFileChange } = useImageUpload({
    bucket: 'branding',
    pathPrefix: business?.id || 'default',
    filePrefix: 'service',
    maxFileSize: 5 * 1024 * 1024,
    compress: async (f) => {
      if (f.size > 500 * 1024 || f.type !== 'image/gif') {
        return compressImage(f, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
      }
      return f;
    },
  });
  const [services, setServices] = useState<Service[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [imageUrl, setImageUrl] = useState('');
  const [imgError, setImgError] = useState('');

  useEffect(() => { if (business?.id) loadServices(); }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadServices = async () => {
    if (!business?.id) return;
    const { data } = await supabase.from('services').select('*').eq('business_id', business.id).order('sort_order');
    if (data) setServices(data);
  };

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgError('');
    handleFileChange(e, (url) => setImageUrl(url), (msg) => setImgError(msg));
  };

  const openNew = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setPrice('');
    setCurrency('ARS');
    setImageUrl('');
    setShowDialog(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description || '');
    setPrice(String(s.price));
    setCurrency(s.currency);
    setImageUrl(s.image_url || '');
    setShowDialog(true);
  };

  const save = async () => {
    if (!name.trim() || !price || !business?.id) return;
    if (editing) {
      await authInvoke('admin-manage-services', {
        action: 'update',
        service_id: editing.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        currency,
        image_url: imageUrl || null,
      });
    } else {
      await authInvoke('admin-manage-services', {
        action: 'create',
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        currency,
        image_url: imageUrl || null,
      });
    }
    setShowDialog(false);
    loadServices();
  };

  const toggleActive = async (s: Service) => {
    await authInvoke('admin-manage-services', {
      action: 'toggle_active',
      service_id: s.id,
      is_active: !s.is_active,
    });
    loadServices();
  };

  const remove = async (id: string) => {
    await authInvoke('admin-manage-services', {
      action: 'delete',
      service_id: id,
    });
    loadServices();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display">Servicios</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Administrá los servicios que ofrecés</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/${business?.slug || '...'}/reservas`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 transition-all duration-200"><ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">Ver reservas</span></Button>
          </a>
          <Button onClick={openNew} size="sm" className="transition-all duration-200"><Plus className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Nuevo servicio</span></Button>
        </div>
      </div>

      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] rounded-2xl border-border/60">
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CalendarCheck className="h-14 w-14 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">No hay servicios creados</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {services.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-3 sm:py-6 gap-3 transition-all duration-200 hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                      <span className="font-medium text-sm sm:text-base">{s.name}</span>
                      {!s.is_active && <Badge variant="secondary" className="text-[10px] sm:text-xs">Inactivo</Badge>}
                    </div>
                    {s.description && <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.description}</p>}
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      ${s.price.toLocaleString('es-AR')} {s.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" className="transition-all duration-200" onClick={() => toggleActive(s)} title={s.is_active ? 'Desactivar' : 'Activar'}>
                      <span className="sm:hidden">{s.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</span>
                      <span className="hidden sm:inline">{s.is_active ? 'Desactivar' : 'Activar'}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="transition-all duration-200 px-2 sm:px-3" onClick={() => openEdit(s)} title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </Button>
                    <Button variant="destructive" size="sm" className="transition-all duration-200 px-2 sm:px-3" onClick={() => remove(s.id)} title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
            <DialogDescription>Completá los datos del servicio</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corte de cabello" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Corte y peinado completo" className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <label className="text-sm font-medium">Precio</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Moneda</label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="ARS" className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Imagen (opcional)</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" className="transition-all duration-200" onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}>
                  {uploadingImg ? 'Subiendo...' : imageUrl ? 'Cambiar' : 'Subir imagen'}
                </Button>
                {imageUrl && <Button type="button" variant="ghost" size="sm" className="transition-all duration-200" onClick={() => setImageUrl('')}>Quitar</Button>}
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleServiceImageChange} />
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: imagen cuadrada, fondo claro, menos de 1MB</p>
              {imgError && (
                <p className="text-xs text-destructive mt-1">{imgError}</p>
              )}
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="mt-2 h-20 w-32 rounded-xl object-cover border border-border/60" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="transition-all duration-200" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!name.trim() || !price} className="transition-all duration-200">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
