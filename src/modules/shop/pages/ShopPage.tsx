import { useEffect, useState, useMemo } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, Loader2, ChevronLeft, ShoppingBag, Package, Check, X, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Product, Category, CartItem } from '../types';
import { CartProvider, useCart } from '../contexts/CartContext';
import { ProductImageSlider } from '../components/ProductImageSlider';
import { useModuleAccess, ModuleBlockedScreen } from '../../subscription';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

function formatPrice(amount: number, currency: string) {
  return `$${amount.toLocaleString('es-AR')} ${currency}`;
}

function ShopPageContent() {
  const { business } = useBusiness();
  const { isModuleEnabled } = useModuleAccess();
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, currency } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [view, setView] = useState<'catalog' | 'detail' | 'cart' | 'checkout'>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutInfo, setCheckoutInfo] = useState<{ preferenceId: string; orderId: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    Promise.all([
      supabase.from('shop_categories').select('*').eq('business_id', business.id).order('sort_order'),
      supabase.from('shop_products').select('*').eq('business_id', business.id).eq('is_active', true).is('deleted_at', null).order('sort_order'),
    ]).then(([catRes, prodRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    });
  }, [business?.id]);

  if (business && !isModuleEnabled('shop')) {
    return <ModuleBlockedScreen moduleId="shop" />;
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  const openDetail = (p: Product) => {
    setSelectedProduct(p);
    setView('detail');
  };

  const handleBuyNow = (p: Product, size?: string | null) => {
    addItem(p, 1, size ?? null);
    setView('cart');
  };

  const startCheckout = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setCheckoutError('Completá todos los datos');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('shop_orders')
        .insert({
          business_id: business?.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          total: subtotal,
          currency,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError || !orderData) throw new Error('Error creating order');

      const orderItems = items.map(i => ({
        business_id: business?.id,
        order_id: orderData.id,
        product_id: i.product.id,
        product_name: i.product.name + (i.selected_size ? ` (${i.selected_size})` : ''),
        quantity: i.quantity,
        unit_price: i.product.price,
        currency: i.product.currency,
        selected_size: i.selected_size,
      }));

      const { error: itemsError } = await supabase.from('shop_order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      const { data: prefData, error: prefError } = await supabase.functions.invoke('create-payment', {
        body: {
          title: `Compra en tienda - ${orderItems.map(i => i.product_name).join(', ')}`,
          quantity: 1,
          price: subtotal,
          currency,
          order_id: orderData.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          business_slug: business?.slug,
        },
      });

      if (prefError || !prefData?.id) throw new Error('Error creating payment preference');

      await supabase.from('shop_orders').update({ preference_id: prefData.id }).eq('id', orderData.id).eq('business_id', business?.id || '');

      setCheckoutInfo({ preferenceId: prefData.id, orderId: orderData.id });
      setView('checkout');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al iniciar pago');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const pollPayment = async (orderId: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('shop_orders').select('payment_status').eq('id', orderId).eq('business_id', business?.id || '').single();
      if (data?.payment_status === 'approved') {
        clearInterval(interval);
        setOrderSuccess(true);
        clearCart();
        for (const item of items) {
          await supabase.rpc('decrement_stock', { p_product_id: item.product.id, p_quantity: item.quantity });
        }
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--booking-bg)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--booking-primary)' }} />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--booking-bg)' }}>
        <header className="py-4 px-6 border-b" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-xl font-bold" style={{ color: 'var(--booking-text)' }}>Tienda</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-booking-primary-light flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" style={{ color: 'var(--booking-primary)' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--booking-text)' }}>¡Compra exitosa!</h2>
            <p className="mb-6" style={{ color: 'var(--booking-text-muted)' }}>Recibimos tu pedido. Te enviaremos los detalles a tu email.</p>
            <button onClick={() => { setView('catalog'); setOrderSuccess(false); setCheckoutInfo(null); }}
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-booking-primary hover:bg-booking-primary-hover transition-colors">
              Seguir comprando
            </button>
          </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--booking-bg)' }}>
      <header className="py-4 px-6 border-b sticky top-0 z-30 shadow-sm" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(view === 'detail' || view === 'cart' || view === 'checkout') && (
              <button onClick={() => { setView(view === 'checkout' ? 'cart' : 'catalog'); setCheckoutInfo(null); }}
                className="p-2 rounded-lg hover:bg-accent transition-colors" style={{ color: 'var(--booking-text)' }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-xl font-bold" style={{ color: 'var(--booking-text)' }}>Tienda</span>
          </div>
          {view === 'catalog' && (
            <button onClick={() => setView('cart')} className="relative p-2 rounded-lg hover:bg-accent transition-colors" style={{ color: 'var(--booking-text)' }}>
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--booking-primary)' }}>{itemCount}</span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {view === 'checkout' && checkoutInfo && (
          <CheckoutScreen preferenceId={checkoutInfo.preferenceId} orderId={checkoutInfo.orderId} pollPayment={pollPayment} />
        )}

        {view === 'cart' && (
          <CartScreen items={items} subtotal={subtotal} currency={currency}
            onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} onClearCart={clearCart}
            customerName={customerName} setCustomerName={setCustomerName}
            customerEmail={customerEmail} setCustomerEmail={setCustomerEmail}
            customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
            onStartCheckout={startCheckout} checkoutLoading={checkoutLoading} checkoutError={checkoutError}
          />
        )}

        {view === 'detail' && selectedProduct && (
          <DetailScreen product={selectedProduct} onAddToCart={(size) => { addItem(selectedProduct, 1, size ?? null); }} onBuyNow={(size) => handleBuyNow(selectedProduct, size)} />
        )}

        {view === 'catalog' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--booking-text-muted)' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 h-12 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
              </div>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="px-4 h-12 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties}>
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <ShoppingBag className="w-16 h-16 mx-auto mb-5" style={{ color: 'var(--booking-text-muted)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--booking-text)' }}>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} onView={() => openDetail(p)} onAddToCart={() => addItem(p)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

        {/* Footer */}
        <footer className="py-5 bg-[#1a1a2e]">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              Buenos Aires, Argentina
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400">
                Pagos seguros con Mercado Pago
              </p>
              <a href="https://bookingbio.com" target="_blank" rel="noopener noreferrer" className="text-sm font-black tracking-tight text-gray-500 hover:text-gray-300 transition-colors">
                by BookingBio
              </a>
            </div>
          </div>
        </footer>
    </div>
  );
}

function ProductCard({ product, onView, onAddToCart }: { product: Product; onView: () => void; onAddToCart: () => void }) {
  const allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col"
      style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)', boxShadow: '0 8px 30px rgba(0,0,0,.05)' }}>
      <button onClick={onView} className="w-full aspect-square overflow-hidden">
        <ProductImageSlider images={allImages} alt={product.name} compact />
      </button>
      <div className="p-4 flex flex-col flex-1">
        <button onClick={onView} className="text-left">
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2" style={{ color: 'var(--booking-text)' }}>{product.name}</h3>
        </button>
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {product.sizes.slice(0, 4).map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--booking-primary-light)', color: 'var(--booking-primary)' }}>{s}</span>
            ))}
            {product.sizes.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--booking-primary-light)', color: 'var(--booking-primary)' }}>+{product.sizes.length - 4}</span>}
          </div>
        )}
        <p className="text-xl font-bold mb-2 tracking-tight" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price, product.currency)}</p>
        <div className="flex items-center gap-2 mb-3">
          {product.stock > 10 ? (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--booking-primary-light)', color: 'var(--booking-primary)' }}>En stock</span>
          ) : product.stock > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Quedan {product.stock}</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>Sin stock</span>
          )}
        </div>
        <div className="mt-auto flex gap-2">
          <button onClick={onView} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border"
            style={{ borderColor: 'var(--booking-border)', color: 'var(--booking-text)' }}>Ver</button>
          {product.stock > 0 && (
            <button onClick={onAddToCart} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--booking-primary)' }}>Comprar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ product, onAddToCart, onBuyNow }: { product: Product; onAddToCart: (size?: string | null) => void; onBuyNow: (size?: string | null) => void }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];
  const hasSizes = product.sizes && product.sizes.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--booking-card-bg)' }}>
            <ProductImageSlider images={allImages} alt={product.name} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--booking-text)' }}>{product.name}</h1>
          <p className="text-3xl font-bold mb-4 tracking-tight" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price, product.currency)}</p>

          {product.stock > 0 ? (
            <p className="text-sm mb-4" style={{ color: 'var(--booking-text-muted)' }}>
              Stock disponible: <span className="font-semibold" style={{ color: 'var(--booking-primary)' }}>{product.stock} unidades</span>
            </p>
          ) : (
            <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--booking-error)' }}>Sin stock</p>
          )}

          {product.sku && <p className="text-xs mb-4" style={{ color: 'var(--booking-caption)' }}>SKU: {product.sku}</p>}

          {hasSizes && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--booking-text)' }}>Talle</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${selectedSize === s ? 'border-current' : 'border-transparent'}`}
                    style={{ backgroundColor: selectedSize === s ? 'var(--booking-primary)' : 'var(--booking-input-bg)', color: selectedSize === s ? 'white' : 'var(--booking-text)', borderColor: selectedSize === s ? 'var(--booking-primary)' : 'var(--booking-border)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--booking-text)' }}>Descripción</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--booking-text-muted)' }}>{product.description}</p>
            </div>
          )}

          <div className="flex gap-3">
            {product.stock > 0 && (
              <>
                <button onClick={() => onAddToCart(selectedSize)} disabled={hasSizes && !selectedSize}
                  className="flex-1 py-3.5 rounded-xl font-semibold transition-colors border disabled:opacity-40 hover:bg-accent"
                  style={{ borderColor: 'var(--booking-border)', color: 'var(--booking-text)' }}>Agregar al carrito</button>
                <button onClick={() => onBuyNow(selectedSize)} disabled={hasSizes && !selectedSize}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white transition-colors disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: 'var(--booking-primary)' }}>Comprar ahora</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartScreen({ items, subtotal, currency, onUpdateQuantity, onRemoveItem, onClearCart,
  customerName, setCustomerName, customerEmail, setCustomerEmail, customerPhone, setCustomerPhone,
  onStartCheckout, checkoutLoading, checkoutError
}: {
  items: CartItem[]; subtotal: number; currency: string;
  onUpdateQuantity: (id: string, q: number, size?: string | null) => void;
  onRemoveItem: (id: string, size?: string | null) => void;
  onClearCart: () => void;
  customerName: string; setCustomerName: (v: string) => void;
  customerEmail: string; setCustomerEmail: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  onStartCheckout: () => Promise<void>; checkoutLoading: boolean; checkoutError: string;
}) {
  const [showForm, setShowForm] = useState(false);

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <ShoppingCart className="w-16 h-16 mx-auto mb-5" style={{ color: 'var(--booking-text-muted)' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--booking-text)' }}>Carrito vacío</h2>
        <p className="mb-6" style={{ color: 'var(--booking-text-muted)' }}>Agregá productos para continuar</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--booking-text)' }}>Carrito ({items.length} productos)</h2>
        <button onClick={onClearCart} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--booking-error)' }}>Vaciar carrito</button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={`${item.product.id}__${item.selected_size || ''}`} className="flex items-center gap-4 p-5 rounded-2xl border"
            style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)', boxShadow: '0 4px 15px rgba(0,0,0,.03)' }}>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-booking-primary-light">
              {item.product.image ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 m-4" style={{ color: 'var(--booking-primary)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate" style={{ color: 'var(--booking-text)' }}>{item.product.name}</h3>
              {item.selected_size && <p className="text-xs" style={{ color: 'var(--booking-text-muted)' }}>Talle: {item.selected_size}</p>}
              <p className="text-sm font-bold" style={{ color: 'var(--booking-primary)' }}>{formatPrice(item.product.price, item.product.currency)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selected_size)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" style={{ color: 'var(--booking-text)' }}><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--booking-text)' }}>{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selected_size)} disabled={item.quantity >= item.product.stock} className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-30" style={{ color: 'var(--booking-text)' }}><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => onRemoveItem(item.product.id, item.selected_size)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'var(--booking-error)' }}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl border mb-6" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
        <div className="flex justify-between text-lg font-bold" style={{ color: 'var(--booking-text)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--booking-primary)' }}>{formatPrice(subtotal, currency)}</span>
        </div>
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--booking-primary)' }}>
          Continuar con la compra
        </button>
      ) : (
        <div className="space-y-4 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--booking-text)' }}>Tus datos</h3>
          {checkoutError && <p className="text-sm" style={{ color: 'var(--booking-error)' }}>{checkoutError}</p>}
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full px-4 h-12 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 h-12 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            placeholder="Teléfono"
            className="w-full px-4 h-12 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <button onClick={onStartCheckout} disabled={checkoutLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: 'var(--booking-primary)' }}>
            {checkoutLoading ? 'Procesando...' : `Pagar ${formatPrice(subtotal, currency)}`}
          </button>
        </div>
      )}
    </div>
  );
}

function CheckoutScreen({ preferenceId, orderId, pollPayment }: {
  preferenceId: string; orderId: string; pollPayment: (id: string) => void;
}) {
  const { business } = useBusiness();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => setLoading(false);
    script.onerror = () => setError('Error al cargar Mercado Pago');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!preferenceId) return;
    const loadWallet = async () => {
      if (!window.MercadoPago) { setTimeout(loadWallet, 500); return; }
      try {
        const { data } = await supabase.functions.invoke('get-mp-config', {
          method: 'POST',
          body: { business_slug: business?.slug },
        });
        const publicKey = data?.publicKey;
        if (!publicKey) { setError('Error de configuración'); return; }
        const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' });
        await mp.bricks().create('wallet', 'mercadopago_container', {
          initialization: { preferenceId, redirectMode: 'blank' },
          customization: { visual: { borderRadius: '12px', buttonHeight: '56px' } },
          callbacks: { onReady: () => { pollPayment(orderId); } },
        });
      } catch { setError('Error al iniciar pago'); }
    };
    loadWallet();
  }, [preferenceId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium" style={{ color: 'var(--booking-error)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--booking-text)' }}>Completá el pago</h2>
      {loading && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: 'var(--booking-primary)' }} />
          <p style={{ color: 'var(--booking-text-muted)' }}>Preparando pago...</p>
        </div>
      )}
      <div id="mercadopago_container" className="min-h-[100px]" />
    </div>
  );
}

export function ShopPage() {
  return (
    <CartProvider>
      <ShopPageContent />
      <ShopMarketingPopup />
      <ShopCountdownBanner />
      <ShopSocialProof />
    </CartProvider>
  );
}

const SHOP_POPUP_KEY = 'shop_popup_config';

interface ShopPopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_url: string;
  image_url: string | null;
  overlay_color: string;
  overlay_opacity: number;
}

function ShopMarketingPopup() {
  const { business } = useBusiness();
  const [config, setConfig] = useState<ShopPopupConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    try {
      const raw = localStorage.getItem(`${SHOP_POPUP_KEY}_${business.id}`);
      if (raw) {
        const parsed: ShopPopupConfig = JSON.parse(raw);
        if (parsed.enabled && !sessionStorage.getItem('shop_popup_dismissed')) {
          setConfig(parsed);
        }
      }
    } catch {}
  }, [business?.id]);

  useEffect(() => {
    if (!config) return;

    const checkScroll = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (pct > 30) {
        setVisible(true);
        window.removeEventListener('scroll', checkScroll);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [config]);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem('shop_popup_dismissed', '1');
  };

  if (!config || !visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <button
        onClick={close}
        className="absolute top-6 right-6 z-[10000] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-all hover:bg-white hover:scale-110"
      >
        <X className="h-5 w-5" />
      </button>

      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {config.image_url && (
          <div className="absolute inset-0">
            <img src={config.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: config.overlay_color, opacity: config.overlay_opacity / 100 }} />
          </div>
        )}

        {!config.image_url && (
          <div className="absolute inset-0" style={{ backgroundColor: config.overlay_color || '#111827' }} />
        )}

        <div className="relative z-10 p-8 sm:p-10 pt-12 text-center">
          {config.title && (
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              {config.title}
            </h3>
          )}
          {config.subtitle && (
            <p className="text-sm sm:text-base text-white/80 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {config.subtitle}
            </p>
          )}
          {config.description && (
            <p className="text-sm text-white/70 leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              {config.description}
            </p>
          )}
          {config.button_text && (
            <a
              href={config.button_url || '#'}
              onClick={close}
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
              style={{ backgroundColor: '#059669' }}
            >
              {config.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const SHOP_BANNER_KEY = 'shop_banner_config';

interface ShopBannerConfig {
  enabled: boolean;
  text: string;
  button_text: string;
  button_url: string;
  end_date: string;
  gradient_from: string;
  gradient_to: string;
  text_color: string;
}

function ShopCountdownBanner() {
  const { business } = useBusiness();
  const [config, setConfig] = useState<ShopBannerConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    try {
      const raw = localStorage.getItem(`${SHOP_BANNER_KEY}_${business.id}`);
      if (raw) {
        const parsed: ShopBannerConfig = JSON.parse(raw);
        if (parsed.enabled) setConfig(parsed);
      }
    } catch {}
  }, [business?.id]);

  useEffect(() => {
    if (!config?.end_date) return;

    const tick = () => {
      const diff = new Date(config.end_date).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config?.end_date]);

  if (!config?.enabled || dismissed || (config.end_date && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  const units = [
    { val: timeLeft.days, label: 'D' },
    { val: timeLeft.hours, label: 'H' },
    { val: timeLeft.minutes, label: 'M' },
    { val: timeLeft.seconds, label: 'S' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] shadow-lg" style={{ background: `linear-gradient(135deg, ${config.gradient_from}, ${config.gradient_to})` }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
        {config.text && (
          <span className="inline-flex items-center rounded-full bg-red-600 px-5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white text-center leading-tight shadow-md shadow-red-600/30">
            {config.text}
          </span>
        )}

        <div className="flex items-center gap-2">
          {units.map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-red-600 text-white text-lg sm:text-2xl font-black tabular-nums leading-none shadow-md shadow-red-600/30">
                {pad(val)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-white/70 mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {config.button_text && (
            <a
              href={config.button_url || '#'}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-wider text-red-600 transition-all duration-200 hover:shadow-lg hover:bg-white/90 active:scale-[0.97] shadow-md"
            >
              {config.button_text}
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

const SHOP_SOCIAL_KEY = 'shop_social_config';

interface SocialEntry {
  id: string;
  name: string;
  product: string;
  location: string;
  time_ago: string;
}

interface ShopSocialConfig {
  enabled: boolean;
  entries: SocialEntry[];
  interval_seconds: number;
}

function ShopSocialProof() {
  const { business } = useBusiness();
  const [config, setConfig] = useState<ShopSocialConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    try {
      const raw = localStorage.getItem(`${SHOP_SOCIAL_KEY}_${business.id}`);
      if (raw) {
        const parsed: ShopSocialConfig = JSON.parse(raw);
        if (parsed.enabled && parsed.entries.length > 0) {
          setConfig(parsed);
        }
      }
    } catch {}
  }, [business?.id]);

  useEffect(() => {
    if (!config || config.entries.length === 0) return;
    const startDelay = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(startDelay);
  }, [config]);

  useEffect(() => {
    if (!config || config.entries.length === 0 || dismissed) return;
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % config.entries.length);
        setShow(true);
      }, 500);
    }, config.interval_seconds * 1000);
    return () => clearInterval(interval);
  }, [config, dismissed]);

  if (!config || config.entries.length === 0 || dismissed || !show) return null;

  const entry = config.entries[currentIndex];

  return (
    <div className="fixed bottom-4 left-4 z-[9997] max-w-xs" style={{ animation: 'slideUpSocial 0.4s ease-out' }}>
      <style>{`
        @keyframes slideUpSocial {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {entry.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-gray-900">{entry.name}</span>
            {' '}<span className="text-gray-500">compró</span>{' '}
            <span className="font-semibold text-emerald-600">{entry.product}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{entry.location} · {entry.time_ago}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
