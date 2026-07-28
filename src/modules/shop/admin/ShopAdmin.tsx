import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Package, BarChart3, ShoppingCart, Loader2, RotateCcw, Archive, ExternalLink, X, Megaphone, Timer, MessageSquare, Copy, Check } from 'lucide-react';
import { supabase, ShopBannerConfig, ShopPopupConfig, ShopSocialConfig, ShopSocialEntry as SocialEntry } from '../../../lib/supabase';
import { allThemes } from '../../../themes';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Product, Category, Order } from '../types';
import { PLAN_LIMITS, SHOP_STORAGE_BUCKET } from '../config';
import { authInvoke } from '../../../pages/admin/helpers';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Separator } from '../../../components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { ImageUploader } from './ImageUploader';
import { MultiImageUploader } from './MultiImageUploader';
import { deleteStorageFile } from './storage-utils';

export function ShopAdmin() {
  const { business } = useBusiness();
  const [view, setView] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'trash' | 'popup' | 'banner' | 'avisos'>('dashboard');
  const { config: bannerCfg, setConfig: setBannerCfg, save: saveBanner } = useShopSubConfig('banner', SHOP_BANNER_DEFAULTS);
  const { config: popupCfg, setConfig: setPopupCfg, save: savePopup } = useShopSubConfig('popup', SHOP_POPUP_DEFAULTS);
  const [shopThemeId, setShopThemeId] = useState('');

  const applyShopTheme = (themeId: string) => {
    const t = allThemes.find(th => th.id === themeId);
    if (!t) return;
    setShopThemeId(themeId);
    const newBanner = { ...bannerCfg, gradient_from: t.tokens.primary, gradient_to: t.tokens.cardBg, text_color: t.tokens.text };
    const newPopup = { ...popupCfg, overlay_color: t.tokens.primary };
    setBannerCfg(newBanner);
    setPopupCfg(newPopup);
    saveBanner(newBanner);
    savePopup(newPopup);
  };

  const copyBrandingToShop = async () => {
    if (!business?.id) return;
    setShopThemeId('');
    const { data } = await supabase.from('branding').select('*').eq('business_id', business.id).maybeSingle();
    if (!data) return;
    const newBanner = { ...bannerCfg, gradient_from: data.primary_color || bannerCfg.gradient_from, gradient_to: data.card_bg_color || bannerCfg.gradient_to, text_color: data.text_color || bannerCfg.text_color };
    const newPopup = { ...popupCfg, overlay_color: data.primary_color || popupCfg.overlay_color };
    setBannerCfg(newBanner);
    setPopupCfg(newPopup);
    saveBanner(newBanner);
    savePopup(newPopup);
  };

  const resetShopColors = () => {
    setShopThemeId('');
    setBannerCfg(SHOP_BANNER_DEFAULTS);
    setPopupCfg(SHOP_POPUP_DEFAULTS);
    saveBanner(SHOP_BANNER_DEFAULTS);
    savePopup(SHOP_POPUP_DEFAULTS);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Colores de la tienda</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyBrandingToShop}>Copiar paleta de Apariencia</Button>
              <Button variant="outline" size="sm" onClick={resetShopColors} title="Restaurar valores predeterminados"><RotateCcw className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allThemes.map(t => (
              <button key={t.id} onClick={() => applyShopTheme(t.id)}
                className={`relative flex items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all ${
                  shopThemeId === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
                }`}>
                <div className="flex gap-1">
                  <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: t.tokens.primary }} />
                  <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: t.tokens.background }} />
                  <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: t.tokens.cardBg }} />
                  <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: t.tokens.text }} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 border-b pb-4 mb-6 overflow-x-auto lg:flex-wrap">
        <button onClick={() => setView('dashboard')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <BarChart3 className="w-4 h-4 inline mr-1.5" />Dashboard
        </button>
        <button onClick={() => setView('products')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Productos
        </button>
        <button onClick={() => setView('categories')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'categories' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          Categorías
        </button>
        <button onClick={() => setView('orders')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'orders' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <ShoppingCart className="w-4 h-4 inline mr-1.5" />Ventas
        </button>
        <button onClick={() => setView('trash')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'trash' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <Archive className="w-4 h-4 inline mr-1.5" />Papelera
        </button>
        <button onClick={() => setView('popup')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'popup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <Megaphone className="w-4 h-4 inline mr-1.5" />Popup
        </button>
        <button onClick={() => setView('banner')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'banner' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <Timer className="w-4 h-4 inline mr-1.5" />Banner
        </button>
        <button onClick={() => setView('avisos')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'avisos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <MessageSquare className="w-4 h-4 inline mr-1.5" />Avisos
        </button>
        <a href="/tienda" target="_blank" rel="noopener noreferrer" className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent lg:ml-auto inline-flex items-center">
          <ExternalLink className="w-4 h-4 mr-1.5" />Ver tienda
        </a>
      </div>
      {view === 'dashboard' && <ShopDashboard />}
      {view === 'products' && <ProductsManager />}
      {view === 'categories' && <CategoriesManager />}
      {view === 'orders' && <OrdersList />}
      {view === 'trash' && <ProductsTrash />}
      {view === 'popup' && <ShopPopupTab />}
      {view === 'banner' && <ShopBannerTab />}
      {view === 'avisos' && <ShopAvisosTab />}
    </div>
  );
}

function ShopDashboard() {
  const { business } = useBusiness();
  const [stats, setStats] = useState({ todaySales: 0, monthSales: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    Promise.all([
      supabase.from('shop_orders').select('total, created_at').eq('business_id', business.id).eq('payment_status', 'approved'),
    ]).then(([ordersRes]) => {
      const orders = ordersRes.data || [];
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      setStats({
        todaySales: orders.filter(o => o.created_at?.startsWith(today)).length,
        monthSales: orders.filter(o => o.created_at?.startsWith(month)).length,
        totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
      });
      setLoading(false);
    });
  }, [business?.id]);

  if (loading) return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99]">
        <CardContent className="p-8">
          <p className="text-4xl font-display tracking-tight text-foreground">{stats.todaySales}</p>
          <p className="text-base text-muted-foreground mt-3">Ventas hoy</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99]">
        <CardContent className="p-8">
          <p className="text-4xl font-display tracking-tight text-foreground">{stats.monthSales}</p>
          <p className="text-base text-muted-foreground mt-3">Ventas del mes</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99]">
        <CardContent className="p-8">
          <p className="text-4xl font-display tracking-tight text-foreground">${stats.totalRevenue.toLocaleString('es-AR')}</p>
          <p className="text-base text-muted-foreground mt-3">Ingresos totales</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductUsageIndicator({ count }: { count: number }) {
  const limit = PLAN_LIMITS.products;
  const remaining = limit - count;
  const percentage = Math.round((count / limit) * 100);
  const isNearLimit = remaining <= 2 && remaining > 0;
  const isAtLimit = remaining <= 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Productos</span>
            <span className="text-sm text-muted-foreground">
              {count} / {limit} utilizados
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between">
            {isAtLimit ? (
              <Badge variant="destructive">Límite alcanzado</Badge>
            ) : isNearLimit ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Te quedan {remaining} producto{remaining !== 1 ? 's' : ''} disponible{remaining !== 1 ? 's' : ''}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Te quedan {remaining} producto{remaining !== 1 ? 's' : ''} disponible{remaining !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsManager() {
  const { business } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const activeCount = products.filter(p => p.is_active).length;
  const isAtLimit = activeCount >= PLAN_LIMITS.products;

  const reload = () => {
    if (!business?.id) return;
    supabase.from('shop_products').select('*').eq('business_id', business.id).is('deleted_at', null).order('sort_order').then(r => { if (r.data) setProducts(r.data); });
  };

  useEffect(() => {
    if (!business?.id) return;
    reload();
    supabase.from('shop_categories').select('*').eq('business_id', business.id).order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    if (isAtLimit) {
      setShowLimitDialog(true);
      return;
    }
    setEditing(null); setName(''); setDescription(''); setPrice(''); setStock(''); setSku(''); setImageUrl(''); setGalleryImages([]); setCategoryId(''); setFeatured(false); setSizes([]); setNewSize(''); setShowDialog(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p); setName(p.name); setDescription(p.description); setPrice(String(p.price)); setStock(String(p.stock)); setSku(p.sku || ''); setImageUrl(p.image || ''); setGalleryImages(p.images || []); setCategoryId(p.category_id || ''); setFeatured(p.featured); setSizes(p.sizes || []); setNewSize(''); setShowDialog(true);
  };

  const save = async () => {
    if (!name.trim() || !price || !business?.id) return;
    setSaving(true);
    const payload = { business_id: business.id, name: name.trim(), description: description.trim(), price: parseFloat(price), currency, stock: parseInt(stock) || 0, sku: sku.trim() || null, image: imageUrl || null, images: galleryImages, category_id: categoryId || null, featured, sizes };
    try {
      if (editing) {
        const { error } = await supabase.from('shop_products').update(payload).eq('id', editing.id).eq('business_id', business.id);
        if (error) console.error('Error updating product:', error);
      } else {
        const { error } = await supabase.from('shop_products').insert(payload);
        if (error) console.error('Error inserting product:', error);
      }
    } catch (e) {
      console.error('Save error:', e);
    }
    setShowDialog(false);
    setSaving(false);
    reload();
  };

  const toggleActive = async (p: Product) => {
    if (!p.is_active && isAtLimit) {
      setShowLimitDialog(true);
      return;
    }
    await supabase.from('shop_products').update({ is_active: !p.is_active }).eq('id', p.id).eq('business_id', business?.id || '');
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const remove = async (p: Product) => {
    await supabase.from('shop_products').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', p.id).eq('business_id', business?.id || '');
    setProducts(prev => prev.filter(x => x.id !== p.id));
  };

  const duplicate = async (p: Product) => {
    if (isAtLimit) {
      setShowLimitDialog(true);
      return;
    }
    if (!business?.id) return;
    const { data } = await supabase.from('shop_products').insert({
      business_id: business.id, name: `${p.name} (copia)`, description: p.description, price: p.price, currency: p.currency, stock: 0, image: p.image, category_id: p.category_id, sizes: p.sizes || [],
    }).select().single();
    if (data) setProducts(prev => [...prev, data]);
  };

  const handleOldImageDelete = (oldUrl: string) => {
    deleteStorageFile(oldUrl, SHOP_STORAGE_BUCKET);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <ProductUsageIndicator count={activeCount} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..." className="pl-10" />
        </div>
        <Button onClick={openNew} size="sm" disabled={isAtLimit}>
          <Plus className="w-4 h-4 mr-1" />Nuevo producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No hay productos</p>
          ) : (
            <div className="divide-y">
              {filtered.map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 sm:w-6 sm:h-6 m-2.5 sm:m-3 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm sm:text-base truncate">{p.name}</span>
                        {!p.is_active && <Badge variant="secondary" className="text-[10px] sm:text-xs">Inactivo</Badge>}
                        {p.featured && <Badge className="text-[10px] sm:text-xs">Destacado</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span>${p.price.toLocaleString('es-AR')} {p.currency}</span>
                        <span>Stock: {p.stock}</span>
                        {p.sizes && p.sizes.length > 0 && <span className="truncate max-w-[120px] sm:max-w-none">Talles: {p.sizes.join(', ')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-0 sm:ml-auto">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(p)} title={p.is_active ? 'Desactivar' : 'Activar'}>
                      {p.is_active ? <span className="sm:hidden"><X className="w-3.5 h-3.5" /></span> : <span className="sm:hidden"><Check className="w-3.5 h-3.5" /></span>}
                      <span className="hidden sm:inline">{p.is_active ? 'Desactivar' : 'Activar'}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => duplicate(p)} className="px-2 sm:px-3" title="Duplicar">
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1">Duplicar</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="px-2" title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(p)} className="px-2" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Completá los datos del producto</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Descripción del producto" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Precio</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Moneda</label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="ARS" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">SKU</label>
              <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="PROD-001" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded" />
                <span className="text-sm">Destacado</span>
              </label>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Talles</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {sizes.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {s}
                    <button type="button" onClick={() => setSizes(sizes.filter((_, j) => j !== i))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="Ej: S, M, L, XL / 38, 39, 40"
                  onKeyDown={e => { if (e.key === 'Enter' && newSize.trim()) { e.preventDefault(); setSizes([...sizes, newSize.trim()]); setNewSize(''); } }} />
                <Button type="button" variant="outline" size="sm" onClick={() => { if (newSize.trim()) { setSizes([...sizes, newSize.trim()]); setNewSize(''); } }}>Agregar</Button>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Imagen principal</label>
              <ImageUploader
                currentImageUrl={imageUrl}
                onUploadComplete={setImageUrl}
                onOldImageDelete={handleOldImageDelete}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Imágenes adicionales (hasta 4)</label>
              <MultiImageUploader
                images={galleryImages}
                onImagesChange={setGalleryImages}
                maxImages={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!name.trim() || !price || saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Guardando...</> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Límite de productos alcanzado</DialogTitle>
            <DialogDescription>
              Tu plan actual permite publicar hasta {PLAN_LIMITS.products} productos activos.
              <br /><br />
              Para agregar más productos podés ampliar tu plan y desbloquear una capacidad mayor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>Cancelar</Button>
            <Button onClick={() => { setShowLimitDialog(false); }}>Conocer planes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoriesManager() {
  const { business } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    supabase.from('shop_categories').select('*').eq('business_id', business.id).order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  }, [business?.id]);

  const save = async () => {
    if (!name.trim() || !business?.id) return;
    await supabase.from('shop_categories').insert({ business_id: business.id, name: name.trim() });
    setName('');
    setShowDialog(false);
    supabase.from('shop_categories').select('*').eq('business_id', business.id).order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  };

  const remove = async (id: string) => {
    await supabase.from('shop_categories').delete().eq('id', id).eq('business_id', business?.id || '');
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categorías</h2>
        <Button onClick={() => setShowDialog(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva categoría</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin categorías</p>
          ) : (
            <div className="divide-y">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
                  <div className="min-w-0">
                    <span className="font-medium text-sm sm:text-base">{c.name}</span>
                    {c.description && <p className="text-xs sm:text-sm text-muted-foreground truncate">{c.description}</p>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => remove(c.id)} className="shrink-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la categoría" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!name.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersList() {
  const { business } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    supabase.from('shop_orders').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).then(r => {
      if (r.data) setOrders(r.data);
      setLoading(false);
    });
  }, [business?.id]);

  const removeOrder = async (o: Order) => {
    await supabase.from('shop_order_items').delete().eq('order_id', o.id).eq('business_id', business?.id || '');
    await supabase.from('shop_orders').delete().eq('id', o.id).eq('business_id', business?.id || '');
    setOrders(prev => prev.filter(x => x.id !== o.id));
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No hay ventas</p>
        ) : (
          <div className="divide-y">
            {orders.map(o => (
              <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">{o.customer_name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{o.customer_email} · {o.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm sm:text-base">${o.total.toLocaleString('es-AR')} {o.currency}</p>
                    <Badge variant={o.payment_status === 'approved' ? 'default' : o.payment_status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] sm:text-xs">
                      {o.payment_status === 'approved' ? 'Pagado' : o.payment_status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    </Badge>
                  </div>
                  <Button variant="destructive" size="sm" className="shrink-0" onClick={() => removeOrder(o)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductsTrash() {
  const { business } = useBusiness();
  const [deleted, setDeleted] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!business?.id) return;
    setLoading(true);
    supabase.from('shop_products').select('*').eq('business_id', business.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
      .then(r => { setDeleted(r.data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const restore = async (p: Product) => {
    await supabase.from('shop_products').update({ deleted_at: null, is_active: true }).eq('id', p.id).eq('business_id', business?.id || '');
    setDeleted(prev => prev.filter(x => x.id !== p.id));
  };

  const purge = async (p: Product) => {
    if (p.image) await deleteStorageFile(p.image, SHOP_STORAGE_BUCKET);
    for (const img of (p.images || [])) {
      await deleteStorageFile(img, SHOP_STORAGE_BUCKET);
    }
    await supabase.from('shop_products').delete().eq('id', p.id);
    setDeleted(prev => prev.filter(x => x.id !== p.id));
  };

  const purgeAll = async () => {
    for (const p of deleted) {
      if (p.image) await deleteStorageFile(p.image, SHOP_STORAGE_BUCKET);
      for (const img of (p.images || [])) {
        await deleteStorageFile(img, SHOP_STORAGE_BUCKET);
      }
    await supabase.from('shop_products').delete().eq('id', p.id).eq('business_id', business?.id || '');
    }
    setDeleted([]);
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Papelera ({deleted.length})</h2>
        {deleted.length > 0 && (
          <Button variant="destructive" size="sm" onClick={purgeAll}>
            <Trash2 className="w-4 h-4 mr-1" />Vaciar papelera
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          {deleted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">La papelera está vacía</p>
          ) : (
            <div className="divide-y">
              {deleted.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 sm:w-6 sm:h-6 m-2.5 sm:m-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm sm:text-base truncate block">{p.name}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">${p.price.toLocaleString('es-AR')} {p.currency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => restore(p)} title="Restaurar">
                      <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1">Restaurar</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => purge(p)} title="Eliminar permanentemente">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SHOP_POPUP_DEFAULTS: ShopPopupConfig = {
  enabled: false,
  title: '¡Oferta especial!',
  subtitle: 'No te pierdas nuestras promociones',
  description: '',
  button_text: 'Ver oferta',
  button_url: '',
  image_url: null,
  overlay_color: '#111827',
  overlay_opacity: 80,
};

function ShopPopupTab() {
  const { business } = useBusiness();
  const { config, setConfig, saving, save } = useShopSubConfig('popup', SHOP_POPUP_DEFAULTS);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;
    setUploading(true);
    try {
      const { compressImage } = await import('../../../lib/image-utils');
      const blob = await compressImage(file, { maxWidth: 800, maxHeight: 600 });
      const path = `${business.id}/shop-popup-${Date.now()}.webp`;
      const { error } = await supabase.storage.from('branding').upload(path, blob, { upsert: false, contentType: 'image/webp' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
      setConfig(prev => ({ ...prev, image_url: (urlData?.publicUrl || '') + `?t=${Date.now()}` }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Activar popup de marketing</span>
          </label>

          <Separator />

          <div>
            <label className="text-sm font-medium">Título</label>
            <Input value={config.title} onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="¡Oferta especial!" />
          </div>
          <div>
            <label className="text-sm font-medium">Subtítulo</label>
            <Input value={config.subtitle} onChange={e => setConfig(prev => ({ ...prev, subtitle: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="No te pierdas nuestras promociones" />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={config.description}
              onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[80px] resize-none"
              placeholder="Describí tu oferta..."
            />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium">Texto del botón</label>
            <Input value={config.button_text} onChange={e => setConfig(prev => ({ ...prev, button_text: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="Ver oferta" />
          </div>
          <div>
            <label className="text-sm font-medium">URL del botón</label>
            <Input value={config.button_url} onChange={e => setConfig(prev => ({ ...prev, button_url: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="#contacto o https://..." />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">Imagen de fondo</label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('shop-popup-image-input')?.click()} disabled={uploading}>
                {uploading ? 'Subiendo...' : config.image_url ? 'Cambiar' : 'Subir imagen'}
              </Button>
              <input id="shop-popup-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {config.image_url && (
                <>
                  <img src={config.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfig(prev => ({ ...prev, image_url: null }))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {config.image_url && (
            <>
              <div>
                <label className="text-sm font-medium">Color de capa</label>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <input type="color" value={config.overlay_color}
                    onChange={e => setConfig(prev => ({ ...prev, overlay_color: e.target.value }))}
                    className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
                  <Input type="text" value={config.overlay_color}
                    onChange={e => setConfig(prev => ({ ...prev, overlay_color: e.target.value }))}
                    className="h-9 font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Opacidad de capa — {config.overlay_opacity}%</label>
                <input type="range" min="0" max="100" value={config.overlay_opacity}
                  onChange={e => setConfig(prev => ({ ...prev, overlay_opacity: Number(e.target.value) }))}
                  className="w-full mt-1" />
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SHOP_BANNER_DEFAULTS: ShopBannerConfig = {
  enabled: false,
  text: '¡Oferta por tiempo limitado!',
  button_text: 'COMPRAR AHORA',
  button_url: '',
  end_date: '',
  gradient_from: '#f97316',
  gradient_to: '#ef4444',
  text_color: '#ffffff',
};

function useShopSubConfig<T>(key: 'banner' | 'popup' | 'social', defaults: T) {
  const { business } = useBusiness();
  const [config, setConfig] = useState<T>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    (async () => {
      const { data } = await supabase
        .from('branding')
        .select('shop_config')
        .eq('business_id', business.id)
        .maybeSingle();
      const cfg = (data?.shop_config as Record<string, unknown> | null)?.[key] as T | null;
      if (cfg) setConfig({ ...defaults, ...cfg });
    })();
  }, [business?.id, key]);

  const save = useCallback(async (next: T) => {
    if (!business?.id) return;
    setSaving(true);
    const { data } = await supabase
      .from('branding')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();
    if (!data) { setSaving(false); return; }
    const currentShopConfig = (data.shop_config || {}) as Record<string, unknown>;
    await authInvoke('admin-update-branding', {
      logo_url: data.logo_url,
      title: data.title,
      subtitle: data.subtitle,
      primary_color: data.primary_color,
      background_color: data.background_color,
      card_bg_color: data.card_bg_color,
      text_color: data.text_color,
      muted_color: data.muted_color,
      caption_color: data.caption_color,
      background_image_url: data.background_image_url,
      bg_opacity: data.bg_opacity,
      overlay_color: data.overlay_color,
      header_color: data.header_color,
      header_opacity: data.header_opacity,
      shop_config: { ...currentShopConfig, [key]: next },
    });
    setSaving(false);
  }, [business?.id, key]);

  return { config, setConfig, saving, save };
}

function ShopBannerTab() {
  const { business } = useBusiness();
  const { config, setConfig, saving, save } = useShopSubConfig('banner', SHOP_BANNER_DEFAULTS);

  const toLocalDatetime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Activar banner fijo con temporizador</span>
          </label>

          <Separator />

          <div>
            <label className="text-sm font-medium">Texto del banner</label>
            <Input value={config.text} onChange={e => setConfig(prev => ({ ...prev, text: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="¡Oferta por tiempo limitado!" />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium">Texto del botón</label>
            <Input value={config.button_text} onChange={e => setConfig(prev => ({ ...prev, button_text: e.target.value.toUpperCase() }))} className="mt-1.5 h-12 rounded-xl uppercase" placeholder="COMPRAR AHORA" />
          </div>
          <div>
            <label className="text-sm font-medium">URL del botón</label>
            <Input value={config.button_url} onChange={e => setConfig(prev => ({ ...prev, button_url: e.target.value }))} className="mt-1.5 h-12 rounded-xl" placeholder="#contacto o https://..." />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium">Fecha y hora de fin</label>
            <input
              type="datetime-local"
              value={toLocalDatetime(config.end_date)}
              onChange={e => setConfig(prev => ({ ...prev, end_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 text-sm"
            />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">Colores del gradiente</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Desde</label>
                <input type="color" value={config.gradient_from}
                  onChange={e => setConfig(prev => ({ ...prev, gradient_from: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <input type="color" value={config.gradient_to}
                  onChange={e => setConfig(prev => ({ ...prev, gradient_to: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Texto</label>
                <input type="color" value={config.text_color}
                  onChange={e => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5" />
              </div>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden h-14 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${config.gradient_from}, ${config.gradient_to})` }}>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: config.text_color }}>Preview del banner</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => save(config)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SHOP_SOCIAL_DEFAULTS: ShopSocialConfig = {
  enabled: false,
  entries: [
    { id: '1', name: 'María', product: 'Remera Básica', location: 'Buenos Aires', time_ago: 'Hace 2 minutos' },
    { id: '2', name: 'Carlos', product: 'Zapatillas Runner', location: 'Córdoba', time_ago: 'Hace 5 minutos' },
    { id: '3', name: 'Lucía', product: 'Campera Urban', location: 'Rosario', time_ago: 'Hace 8 minutos' },
    { id: '4', name: 'Pedro', product: 'Jeans Slim Fit', location: 'Mendoza', time_ago: 'Hace 12 minutos' },
    { id: '5', name: 'Ana', product: 'Buzo Oversized', location: 'Santa Fe', time_ago: 'Hace 15 minutos' },
  ],
  interval_seconds: 8,
};

function ShopAvisosTab() {
  const { business } = useBusiness();
  const { config, setConfig, saving, save } = useShopSubConfig('social', SHOP_SOCIAL_DEFAULTS);
  const [editingEntry, setEditingEntry] = useState<SocialEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  const addEntry = () => {
    const newEntry: SocialEntry = {
      id: Date.now().toString(),
      name: '',
      product: '',
      location: '',
      time_ago: 'Hace 2 minutos',
    };
    setEditingEntry(newEntry);
    setShowForm(true);
  };

  const editEntry = (entry: SocialEntry) => {
    setEditingEntry({ ...entry });
    setShowForm(true);
  };

  const saveEntry = () => {
    if (!editingEntry) return;
    if (editingEntry.name.trim() && editingEntry.product.trim()) {
      const exists = config.entries.find(e => e.id === editingEntry.id);
      if (exists) {
        setConfig(prev => ({
          ...prev,
          entries: prev.entries.map(e => e.id === editingEntry.id ? editingEntry : e),
        }));
      } else {
        setConfig(prev => ({
          ...prev,
          entries: [...prev.entries, editingEntry],
        }));
      }
    }
    setEditingEntry(null);
    setShowForm(false);
  };

  const removeEntry = (id: string) => {
    setConfig(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Mostrar avisos de compra en la tienda</span>
          </label>

          <Separator />

          <div>
            <label className="text-sm font-medium">Intervalo entre avisos (segundos)</label>
            <Input
              type="number"
              min={3}
              max={60}
              value={config.interval_seconds}
              onChange={e => setConfig(prev => ({ ...prev, interval_seconds: Math.max(3, parseInt(e.target.value) || 8) }))}
              className="mt-1.5 h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">Tiempo entre cada aviso automático (mínimo 3s)</p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Avisos de compra</p>
              <p className="text-xs text-muted-foreground">{config.entries.length} avisos configurados</p>
            </div>
            <Button variant="outline" size="sm" onClick={addEntry}>
              <Plus className="w-4 h-4 mr-1" />Agregar aviso
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {config.entries.map(entry => (
          <Card key={entry.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    <span className="text-foreground">{entry.name}</span>
                    {' '}compró{' '}
                    <span className="text-primary font-semibold">{entry.product}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.location} · {entry.time_ago}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => editEntry(entry)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => removeEntry(entry.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {config.entries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No hay avisos configurados</p>
              <p className="text-xs text-muted-foreground mt-1">Agregá avisos para mostrar compras recientes en la tienda</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => save(config)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
          Guardar
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditingEntry(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry?.id && config.entries.find(e => e.id === editingEntry.id) ? 'Editar aviso' : 'Nuevo aviso de compra'}</DialogTitle>
            <DialogDescription>Completá los datos del aviso que se mostrará en la tienda.</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Nombre del comprador</label>
                <Input
                  value={editingEntry.name}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="Ej: María"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Producto comprado</label>
                <Input
                  value={editingEntry.product}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, product: e.target.value } : null)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="Ej: Remera Básica"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ubicación</label>
                <Input
                  value={editingEntry.location}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, location: e.target.value } : null)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="Ej: Buenos Aires"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tiempo que hace</label>
                <Input
                  value={editingEntry.time_ago}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, time_ago: e.target.value } : null)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="Ej: Hace 2 minutos"
                />
              </div>

              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(editingEntry.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{editingEntry.name || 'Nombre'}</span>
                      {' '}compró{' '}
                      <span className="text-primary font-semibold">{editingEntry.product || 'Producto'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{editingEntry.location || 'Ubicación'} · {editingEntry.time_ago || 'Tiempo'}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingEntry(null); }}>Cancelar</Button>
                <Button onClick={saveEntry} disabled={!editingEntry.name.trim() || !editingEntry.product.trim()}>
                  Guardar aviso
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
