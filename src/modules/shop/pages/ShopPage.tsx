import { useEffect, useState, useMemo } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, Loader2, ChevronLeft, ShoppingBag, Package, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Product, Category, CartItem } from '../types';
import { CartProvider, useCart } from '../contexts/CartContext';

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
      supabase.from('shop_products').select('*').eq('business_id', business.id).eq('is_active', true).order('sort_order'),
    ]).then(([catRes, prodRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    });
  }, [business?.id]);

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

  const handleBuyNow = (p: Product) => {
    addItem(p);
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
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
        currency: i.product.currency,
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
              className="px-6 py-3 rounded-xl font-semibold text-white bg-booking-primary hover:bg-booking-primary-hover transition-colors">
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--booking-bg)' }}>
      <header className="py-4 px-6 border-b sticky top-0 z-30" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
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
          <DetailScreen product={selectedProduct} onAddToCart={() => { addItem(selectedProduct); }} onBuyNow={() => handleBuyNow(selectedProduct)} />
        )}

        {view === 'catalog' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--booking-text-muted)' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
              </div>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties}>
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--booking-text-muted)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--booking-text)' }}>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} onView={() => openDetail(p)} onAddToCart={() => addItem(p)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onView, onAddToCart }: { product: Product; onView: () => void; onAddToCart: () => void }) {
  return (
    <div className="rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col"
      style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
      <button onClick={onView} className="w-full aspect-square overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--booking-primary-light)' }}>
            <Package className="w-12 h-12" style={{ color: 'var(--booking-primary)' }} />
          </div>
        )}
      </button>
      <div className="p-3 flex flex-col flex-1">
        <button onClick={onView} className="text-left">
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2" style={{ color: 'var(--booking-text)' }}>{product.name}</h3>
        </button>
        <p className="text-lg font-bold mb-2" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price, product.currency)}</p>
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
          <button onClick={onView} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border"
            style={{ borderColor: 'var(--booking-border)', color: 'var(--booking-text)' }}>Ver</button>
          {product.stock > 0 && (
            <button onClick={onAddToCart} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--booking-primary)' }}>Comprar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ product, onAddToCart, onBuyNow }: { product: Product; onAddToCart: () => void; onBuyNow: () => void }) {
  const [currentImage, setCurrentImage] = useState(0);
  const allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-xl overflow-hidden mb-3" style={{ backgroundColor: 'var(--booking-card-bg)' }}>
            {allImages[currentImage] ? (
              <img src={allImages[currentImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--booking-primary-light)' }}>
                <Package className="w-20 h-20" style={{ color: 'var(--booking-primary)' }} />
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${i === currentImage ? 'border-booking-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--booking-text)' }}>{product.name}</h1>
          <p className="text-3xl font-bold mb-4" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price, product.currency)}</p>

          {product.stock > 0 ? (
            <p className="text-sm mb-4" style={{ color: 'var(--booking-text-muted)' }}>
              Stock disponible: <span className="font-semibold" style={{ color: 'var(--booking-primary)' }}>{product.stock} unidades</span>
            </p>
          ) : (
            <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--booking-error)' }}>Sin stock</p>
          )}

          {product.sku && <p className="text-xs mb-4" style={{ color: 'var(--booking-caption)' }}>SKU: {product.sku}</p>}

          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--booking-text)' }}>Descripción</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--booking-text-muted)' }}>{product.description}</p>
            </div>
          )}

          <div className="flex gap-3">
            {product.stock > 0 && (
              <>
                <button onClick={onAddToCart} className="flex-1 py-3 rounded-xl font-semibold transition-colors border"
                  style={{ borderColor: 'var(--booking-border)', color: 'var(--booking-text)' }}>Agregar al carrito</button>
                <button onClick={onBuyNow} className="flex-1 py-3 rounded-xl font-semibold text-white transition-colors"
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
  onUpdateQuantity: (id: string, q: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  customerName: string; setCustomerName: (v: string) => void;
  customerEmail: string; setCustomerEmail: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  onStartCheckout: () => Promise<void>; checkoutLoading: boolean; checkoutError: string;
}) {
  const [showForm, setShowForm] = useState(false);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--booking-text-muted)' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--booking-text)' }}>Carrito vacío</h2>
        <p className="mb-6" style={{ color: 'var(--booking-text-muted)' }}>Agregá productos para continuar</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--booking-text)' }}>Carrito ({items.length} productos)</h2>
        <button onClick={onClearCart} className="text-sm font-medium" style={{ color: 'var(--booking-error)' }}>Vaciar carrito</button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.product.id} className="flex items-center gap-4 p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-booking-primary-light">
              {item.product.image ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 m-4" style={{ color: 'var(--booking-primary)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate" style={{ color: 'var(--booking-text)' }}>{item.product.name}</h3>
              <p className="text-sm font-bold" style={{ color: 'var(--booking-primary)' }}>{formatPrice(item.product.price, item.product.currency)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded hover:bg-accent" style={{ color: 'var(--booking-text)' }}><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center text-sm font-medium" style={{ color: 'var(--booking-text)' }}>{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="p-1 rounded hover:bg-accent disabled:opacity-30" style={{ color: 'var(--booking-text)' }}><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => onRemoveItem(item.product.id)} className="p-1.5 rounded hover:bg-red-50" style={{ color: 'var(--booking-error)' }}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border mb-6" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
        <div className="flex justify-between text-lg font-bold" style={{ color: 'var(--booking-text)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--booking-primary)' }}>{formatPrice(subtotal, currency)}</span>
        </div>
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--booking-primary)' }}>
          Continuar con la compra
        </button>
      ) : (
        <div className="space-y-4 p-4 rounded-xl border" style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--booking-text)' }}>Tus datos</h3>
          {checkoutError && <p className="text-sm" style={{ color: 'var(--booking-error)' }}>{checkoutError}</p>}
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            placeholder="Teléfono"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--booking-input-bg)', borderColor: 'var(--booking-border)', color: 'var(--booking-text)', '--tw-ring-color': 'var(--booking-ring)' } as React.CSSProperties} />
          <button onClick={onStartCheckout} disabled={checkoutLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
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
    </CartProvider>
  );
}
