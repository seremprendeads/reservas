import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, BarChart3, ShoppingCart, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Product, Category, Order } from '../types';
import { PLAN_LIMITS, SHOP_STORAGE_BUCKET } from '../config';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { ImageUploader } from './ImageUploader';
import { deleteStorageFile } from './storage-utils';

export function ShopAdmin() {
  const [view, setView] = useState<'dashboard' | 'products' | 'categories' | 'orders'>('dashboard');
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4 mb-6">
        <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <BarChart3 className="w-4 h-4 inline mr-1.5" />Dashboard
        </button>
        <button onClick={() => setView('products')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Productos
        </button>
        <button onClick={() => setView('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'categories' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          Categorías
        </button>
        <button onClick={() => setView('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'orders' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
          <ShoppingCart className="w-4 h-4 inline mr-1.5" />Ventas
        </button>
      </div>
      {view === 'dashboard' && <ShopDashboard />}
      {view === 'products' && <ProductsManager />}
      {view === 'categories' && <CategoriesManager />}
      {view === 'orders' && <OrdersList />}
    </div>
  );
}

function ShopDashboard() {
  const [stats, setStats] = useState({ todaySales: 0, monthSales: 0, totalRevenue: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('shop_orders').select('total, created_at').eq('payment_status', 'approved'),
      supabase.from('shop_products').select('id').lt('stock', 5).eq('is_active', true),
    ]).then(([ordersRes, lowRes]) => {
      const orders = ordersRes.data || [];
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      setStats({
        todaySales: orders.filter(o => o.created_at?.startsWith(today)).length,
        monthSales: orders.filter(o => o.created_at?.startsWith(month)).length,
        totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
        lowStock: lowRes.data?.length || 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ventas hoy</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{stats.todaySales}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ventas del mes</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{stats.monthSales}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ingresos totales</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString('es-AR')}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stock bajo</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-destructive">{stats.lowStock}</p></CardContent></Card>
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
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const activeCount = products.filter(p => p.is_active).length;
  const isAtLimit = activeCount >= PLAN_LIMITS.products;

  const reload = () => {
    supabase.from('shop_products').select('*').order('sort_order').then(r => { if (r.data) setProducts(r.data); });
  };

  useEffect(() => {
    reload();
    supabase.from('shop_categories').select('*').order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  }, []);

  const openNew = () => {
    if (isAtLimit) {
      setShowLimitDialog(true);
      return;
    }
    setEditing(null); setName(''); setDescription(''); setPrice(''); setStock(''); setSku(''); setImageUrl(''); setCategoryId(''); setFeatured(false); setShowDialog(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p); setName(p.name); setDescription(p.description); setPrice(String(p.price)); setStock(String(p.stock)); setSku(p.sku || ''); setImageUrl(p.image || ''); setCategoryId(p.category_id || ''); setFeatured(p.featured); setShowDialog(true);
  };

  const save = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    const payload = { name: name.trim(), description: description.trim(), price: parseFloat(price), currency, stock: parseInt(stock) || 0, sku: sku.trim() || null, image: imageUrl || null, category_id: categoryId || null, featured };
    if (editing) {
      await supabase.from('shop_products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('shop_products').insert(payload);
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
    await supabase.from('shop_products').update({ is_active: !p.is_active }).eq('id', p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const remove = async (p: Product) => {
    if (p.image) {
      await deleteStorageFile(p.image, SHOP_STORAGE_BUCKET);
    }
    await supabase.from('shop_products').delete().eq('id', p.id);
    setProducts(prev => prev.filter(x => x.id !== p.id));
  };

  const duplicate = async (p: Product) => {
    if (isAtLimit) {
      setShowLimitDialog(true);
      return;
    }
    const { data } = await supabase.from('shop_products').insert({
      name: `${p.name} (copia)`, description: p.description, price: p.price, currency: p.currency, stock: 0, image: p.image, category_id: p.category_id,
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
                <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{p.name}</span>
                      {!p.is_active && <Badge variant="secondary">Inactivo</Badge>}
                      {p.featured && <Badge>Destacado</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>${p.price.toLocaleString('es-AR')} {p.currency}</span>
                      <span>Stock: {p.stock}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>{p.is_active ? 'Desactivar' : 'Activar'}</Button>
                    <Button variant="outline" size="sm" onClick={() => duplicate(p)}>Duplicar</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Completá los datos del producto</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Descripción del producto" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda</label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="ARS" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU (opcional)</label>
              <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="PROD-001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded" />
                <span className="text-sm">Destacado</span>
              </label>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Imagen del producto</label>
              <ImageUploader
                currentImageUrl={imageUrl}
                onUploadComplete={setImageUrl}
                onOldImageDelete={handleOldImageDelete}
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    supabase.from('shop_categories').select('*').order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    await supabase.from('shop_categories').insert({ name: name.trim() });
    setName('');
    setShowDialog(false);
    supabase.from('shop_categories').select('*').order('sort_order').then(r => { if (r.data) setCategories(r.data); });
  };

  const remove = async (id: string) => {
    await supabase.from('shop_categories').delete().eq('id', id);
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
                <div key={c.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('shop_orders').select('*').order('created_at', { ascending: false }).then(r => {
      if (r.data) setOrders(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No hay ventas</p>
        ) : (
          <div className="divide-y">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{o.customer_email} · {o.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${o.total.toLocaleString('es-AR')} {o.currency}</p>
                  <Badge variant={o.payment_status === 'approved' ? 'default' : o.payment_status === 'pending' ? 'secondary' : 'destructive'}>
                    {o.payment_status === 'approved' ? 'Pagado' : o.payment_status === 'pending' ? 'Pendiente' : 'Rechazado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
