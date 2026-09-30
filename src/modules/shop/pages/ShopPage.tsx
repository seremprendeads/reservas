import { useEffect, useState, useMemo, useCallback, useRef, CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ShoppingCart, Minus, Plus, Trash2, Loader2, ChevronLeft, ShoppingBag, Package, Check, X, MapPin, Lock, Wallet, ShieldCheck } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { supabase, ShopConfig, ShopColorsConfig } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Product, Category, CartItem } from '../types';
import { CartProvider, useCart } from '../contexts/CartContext';
import { ProductImageSlider } from '../components/ProductImageSlider';
import { CartToast } from '../components/CartToast';
import { useModuleAccess, ModuleBlockedScreen } from '../../subscription';
import { LegalFooterLinks } from '../../../components/legal/LegalFooterLinks';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

// Sin la sigla de la moneda: el cliente final ya sabe en que paga.
function formatPrice(amount: number) {
  return `$${amount.toLocaleString('es-AR')}`;
}

function ShopPageContent({ forcedSlug }: { forcedSlug?: string }) {
  // La tienda tomaba el negocio solo de lo que hubiera quedado guardado en el
  // navegador: al abrir el link compartido por primera vez, no habia negocio y
  // la pagina se quedaba cargando para siempre. Ahora se resuelve por el slug
  // de la direccion, como el resto de las paginas publicas.
  const { slug: urlSlug } = useParams<{ slug: string }>();
  // forcedSlug lo usa la ruta "/tienda" (dominio raiz, sin :slug en la URL)
  // para resolver siempre el negocio "bioweblink" — mismo patron que "/" en
  // LandingPage y "/reservas" en BookingPage.
  const slug = forcedSlug || urlSlug;
  const { business, setBusinessBySlug } = useBusiness();
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
  const [negocioNoEncontrado, setNegocioNoEncontrado] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const cartToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCartToast = useCallback((productName: string) => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    setCartToast(productName);
    cartToastTimer.current = setTimeout(() => setCartToast(null), 3000);
  }, []);

  useEffect(() => () => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (business?.slug === slug) return;
    setBusinessBySlug(slug);
  }, [slug, business?.slug, setBusinessBySlug]);

  // Sin slug en la direccion y sin negocio guardado no hay tienda que mostrar.
  // Se espera un momento por si el contexto todavia esta resolviendo.
  useEffect(() => {
    if (slug || business?.id) {
      setNegocioNoEncontrado(false);
      return;
    }
    const t = setTimeout(() => setNegocioNoEncontrado(true), 3000);
    return () => clearTimeout(t);
  }, [slug, business?.id]);

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

  // Este useMemo tiene que ir ANTES del return condicional de abajo: los
  // hooks deben llamarse siempre en el mismo orden en todos los renders.
  // Antes vivía después, y al pasar de "cargando" a "sin módulo tienda" React
  // veía una cantidad distinta de hooks entre renders y crasheaba en blanco,
  // sin ningún error visible (mismo bug ya corregido antes en BookingPage.tsx).
  const filtered = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  if (business && !isModuleEnabled('shop')) {
    return <ModuleBlockedScreen moduleId="shop" />;
  }

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
    if (!business?.id) {
      setCheckoutError('No pudimos identificar la tienda. Recargá la página e intentá de nuevo.');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      // El id del pedido lo genera el cliente a proposito.
      //
      // Antes se hacia .insert().select().single() para recuperar el id. El
      // .select() hace que PostgREST agregue RETURNING a la sentencia, y en
      // Postgres RETURNING tambien evalua las policies de SELECT, no solo las
      // de INSERT. En shop_orders no hay policy de SELECT para anon (a
      // proposito: abrirla expondría nombre, email y telefono de TODOS los
      // pedidos de TODOS los negocios a cualquiera que llame al endpoint), asi
      // que el insert rebotaba con 42501 y el checkout no arrancaba.
      // Generando el id aca, el INSERT no necesita devolver nada.
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase
        .from('shop_orders')
        .insert({
          id: orderId,
          business_id: business.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          total: subtotal,
          currency,
          payment_status: 'pending',
        });

      if (orderError) throw new Error('Error creating order');

      const orderItems = items.map(i => ({
        business_id: business.id,
        order_id: orderId,
        product_id: i.product.id,
        product_name: i.product.name + (i.selected_size ? ` (${i.selected_size})` : ''),
        quantity: i.quantity,
        unit_price: i.product.price,
        currency: i.product.currency,
        selected_size: i.selected_size,
      }));

      const { error: itemsError } = await supabase.from('shop_order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Antes esto llamaba a create-payment, que es la funcion de reservas y
      // espera otros campos: respondia 400 y la compra ni arrancaba. Ahora va a
      // create-shop-payment, que ademas recalcula el total en el servidor y
      // guarda el preference_id por su cuenta.
      const { data: prefData, error: prefError } = await supabase.functions.invoke('create-shop-payment', {
        body: {
          business_slug: business.slug,
          order_id: orderId,
        },
      });

      if (prefError || !prefData?.id) {
        throw new Error(prefData?.error || 'No se pudo iniciar el pago. Intentá de nuevo.');
      }

      setCheckoutInfo({ preferenceId: prefData.id, orderId });
      setView('checkout');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al iniciar pago');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const pollPayment = async (orderId: string) => {
    // El stock ya no se descuenta acá: lo hace el webhook cuando el pago se
    // aprueba. Antes, si el comprador cerraba la pestania, el stock no bajaba.
    const interval = setInterval(async () => {
      const { data } = await supabase.functions.invoke('public-shop-order-status', {
        body: { order_id: orderId, business_id: business?.id },
      });
      if (data?.payment_status === 'approved') {
        clearInterval(interval);
        setOrderSuccess(true);
        clearCart();
      }
    }, 5000);

    // Se corta solo a los 10 minutos para no dejar el intervalo girando.
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  if (negocioNoEncontrado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--booking-bg)' }}>
        <div className="text-center max-w-sm">
          <ShoppingBag className="w-10 h-10 mx-auto mb-4 opacity-40" style={{ color: 'var(--booking-text)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--booking-text)' }}>Tienda no encontrada</p>
          <p className="text-sm mt-2 opacity-70" style={{ color: 'var(--booking-text)' }}>
            Revisá el enlace: la dirección tiene que incluir el nombre del negocio.
          </p>
        </div>
      </div>
    );
  }

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
          <DetailScreen product={selectedProduct} onAddToCart={(size) => { addItem(selectedProduct, 1, size ?? null); showCartToast(selectedProduct.name); }} onBuyNow={(size) => handleBuyNow(selectedProduct, size)} />
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
                  <ProductCard key={p.id} product={p} onView={() => openDetail(p)} onAddToCart={() => { addItem(p); showCartToast(p.name); }} />
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
              <a href="https://bioweblink.com" target="_blank" rel="noopener noreferrer" className="text-sm font-black tracking-tight text-gray-500 hover:text-gray-300 transition-colors">
                by BiowebLink
              </a>
            </div>
          </div>
          {/* Enlaces legales del negocio (mismo negocio cuyos productos se muestran) */}
          <div className="max-w-6xl mx-auto px-6 mt-3">
            <LegalFooterLinks slug={business?.slug} className="text-xs text-gray-400" linkClassName="hover:text-gray-200" />
          </div>
        </footer>

        {cartToast && (
          <CartToast
            productName={cartToast}
            onViewCart={() => { setCartToast(null); setView('cart'); }}
          />
        )}
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
        <p className="text-xl font-bold mb-2 tracking-tight" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price)}</p>
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
          <p className="text-2xl font-bold mb-4 tracking-tight" style={{ color: 'var(--booking-primary)' }}>{formatPrice(product.price)}</p>

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
                <button onClick={() => onAddToCart(selectedSize)}
                  className="flex-1 py-3.5 rounded-xl font-semibold transition-colors border hover:bg-accent"
                  style={{ borderColor: 'var(--booking-border)', color: 'var(--booking-text)' }}>Agregar al carrito</button>
                <button onClick={() => onBuyNow(selectedSize)}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--booking-primary)' }}>Comprar ahora</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SURFACE: CSSProperties = {
  backgroundColor: 'var(--booking-card-bg)',
  borderColor: 'var(--booking-border)',
};

const FIELD = {
  backgroundColor: 'var(--booking-input-bg)',
  borderColor: 'var(--booking-border)',
  color: 'var(--booking-text)',
  '--tw-ring-color': 'var(--booking-ring)',
} as CSSProperties;

const CHECKOUT_STEPS = ['Carrito', 'Tus datos', 'Pago'];

function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-1.5">
      {CHECKOUT_STEPS.map((label, index) => {
        const step = index + 1;
        const reached = step <= current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: reached ? 'var(--booking-primary)' : 'var(--booking-primary-light)',
                  color: reached ? '#fff' : 'var(--booking-primary)',
                }}
              >
                {step < current ? <Check className="h-4 w-4" /> : step}
              </span>
              <span
                className="hidden text-sm font-medium sm:inline"
                style={{ color: step === current ? 'var(--booking-text)' : 'var(--booking-text-muted)' }}
              >
                {label}
              </span>
            </span>
            {index < CHECKOUT_STEPS.length - 1 && (
              <span className="mx-1 h-px w-5 sm:w-10" style={{ backgroundColor: 'var(--booking-border)' }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function LabeledInput({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--booking-text)' }}>{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border px-4 text-sm transition-colors focus:outline-none focus:ring-2"
        style={FIELD}
      />
      {hint && <span className="mt-1 block text-[11px]" style={{ color: 'var(--booking-text-muted)' }}>{hint}</span>}
    </label>
  );
}

function TrustNote() {
  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--booking-text-muted)' }}>
      <Lock className="h-3.5 w-3.5" />
      Pago 100% seguro procesado por Mercado Pago
    </p>
  );
}

function CartScreen({ items, subtotal, onUpdateQuantity, onRemoveItem, onClearCart,
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <CheckoutSteps current={showForm ? 2 : 1} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--booking-text)' }}>
              Tu carrito ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
            </h2>
            <button onClick={onClearCart} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--booking-error)' }}>
              Vaciar
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border" style={SURFACE}>
            {items.map((item, index) => (
              <div
                key={`${item.product.id}__${item.selected_size || ''}`}
                className="flex gap-4 p-4"
                style={{ borderTop: index === 0 ? 'none' : '1px solid var(--booking-border)' }}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-booking-primary-light">
                  {item.product.image
                    ? <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    : <Package className="m-4 h-8 w-8" style={{ color: 'var(--booking-primary)' }} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--booking-text)' }}>{item.product.name}</h3>
                    <button
                      onClick={() => onRemoveItem(item.product.id, item.selected_size)}
                      className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-50"
                      style={{ color: 'var(--booking-error)' }}
                      aria-label="Quitar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {item.selected_size && (
                      <span className="rounded-lg px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--booking-primary-light)', color: 'var(--booking-primary)' }}>
                        Talle {item.selected_size}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--booking-text-muted)' }}>{formatPrice(item.product.price)} c/u</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-xl border" style={{ borderColor: 'var(--booking-border)' }}>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selected_size)}
                        className="p-2 transition-colors hover:bg-accent"
                        style={{ color: 'var(--booking-text)' }}
                        aria-label="Restar uno"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--booking-text)' }}>{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selected_size)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-2 transition-colors hover:bg-accent disabled:opacity-30"
                        style={{ color: 'var(--booking-text)' }}
                        aria-label="Sumar uno"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--booking-primary)' }}>{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border p-5 lg:sticky lg:top-24" style={SURFACE}>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--booking-text-muted)' }}>
            Resumen de compra
          </h3>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: 'var(--booking-text-muted)' }}>Productos</dt>
              <dd style={{ color: 'var(--booking-text)' }}>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--booking-text-muted)' }}>Envío</dt>
              <dd style={{ color: 'var(--booking-text-muted)' }}>A coordinar</dd>
            </div>
          </dl>

          <div className="my-4 border-t" style={{ borderColor: 'var(--booking-border)' }} />

          <div className="mb-5 flex items-baseline justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--booking-text)' }}>Total</span>
            <span className="text-xl font-bold" style={{ color: 'var(--booking-primary)' }}>{formatPrice(subtotal)}</span>
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-xl py-3.5 font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--booking-primary)' }}
            >
              Continuar con la compra
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold" style={{ color: 'var(--booking-text)' }}>Tus datos</p>
              {checkoutError && (
                <p className="rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: '#fef2f2', color: 'var(--booking-error)' }}>{checkoutError}</p>
              )}
              <LabeledInput label="Nombre completo" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Juan Pérez" />
              <LabeledInput label="Email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="juan@email.com" hint="Ahí te llega el comprobante" />
              <LabeledInput label="Teléfono" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="11 2345 6789" />
              <button
                onClick={onStartCheckout}
                disabled={checkoutLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--booking-primary)' }}
              >
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {checkoutLoading ? 'Procesando...' : 'Continuar al pago'}
              </button>
            </div>
          )}

          <TrustNote />
        </aside>
      </div>
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
    <div className="mx-auto max-w-lg py-6">
      <CheckoutSteps current={3} />

      <h2 className="mb-1 text-center text-xl font-bold" style={{ color: 'var(--booking-text)' }}>Completá el pago</h2>
      <p className="mb-6 text-center text-sm" style={{ color: 'var(--booking-text-muted)' }}>Elegí cómo querés pagar y confirmá tu compra</p>

      <div className="mb-4 rounded-2xl border p-5" style={SURFACE}>
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--booking-text-muted)' }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Método de pago
        </p>

        <div className="flex items-center gap-3 rounded-xl border-2 p-4" style={{ borderColor: 'var(--booking-primary)', backgroundColor: 'var(--booking-primary-light)' }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#009EE3' }}>
            <Wallet className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--booking-text)' }}>Mercado Pago</p>
            <p className="text-xs" style={{ color: 'var(--booking-text-muted)' }}>Tarjetas de crédito, débito y dinero en cuenta</p>
          </div>
          <Check className="h-5 w-5 shrink-0" style={{ color: 'var(--booking-primary)' }} />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--booking-text-muted)' }}>
          Aceptamos Visa, Mastercard, American Express y pagos con QR
        </p>
      </div>

      {loading && (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin" style={{ color: 'var(--booking-primary)' }} />
          <p style={{ color: 'var(--booking-text-muted)' }}>Preparando pago seguro...</p>
        </div>
      )}

      <div id="mercadopago_container" className="min-h-[100px]" />

      <TrustNote />
    </div>
  );
}

function useShopConfig() {
  const { business } = useBusiness();
  const [config, setConfig] = useState<ShopConfig | null>(null);

  useEffect(() => {
    if (!business?.id) return;
    supabase
      .from('branding')
      .select('shop_config')
      .eq('business_id', business.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.shop_config) setConfig(data.shop_config as ShopConfig);
      });
  }, [business?.id]);

  return config;
}

// Aplica los colores PROPIOS de la tienda como variables CSS, acotados a este
// contenedor. ThemeContext define las mismas variables globalmente desde el
// branding (que es el de la Bio y la Landing); al redefinirlas aca, la tienda se
// ve distinto sin repintar el resto del sitio.
//
// Si el negocio todavia no guardo paleta, se devuelve {} y sigue mandando el
// branding de siempre, que es el comportamiento anterior.
function shopColorVars(colors: ShopColorsConfig | null | undefined): CSSProperties {
  if (!colors?.primary) return {};
  return {
    '--booking-primary': colors.primary,
    '--booking-primary-hover': colors.primary_hover,
    '--booking-primary-light': colors.primary_light,
    '--booking-bg': colors.background,
    '--booking-card-bg': colors.card_bg,
    '--booking-text': colors.text,
    '--booking-text-muted': colors.text_muted,
    '--booking-border': colors.border,
    // Derivados de los mismos colores, para que los controles que usan estas
    // variables (anillo de foco, captions, fondo de inputs) no queden con el
    // tono de la Bio.
    '--booking-ring': colors.primary,
    '--booking-caption': colors.text_muted,
    '--booking-input-bg': colors.card_bg,
  } as CSSProperties;
}

export function ShopPage({ slug }: { slug?: string } = {}) {
  const config = useShopConfig();
  return (
    <div style={shopColorVars(config?.colors)}>
      <CartProvider>
        <ShopPageContent forcedSlug={slug} />
        <ShopMarketingPopup />
        <ShopCountdownBanner />
        <ShopSocialProof />
      </CartProvider>
    </div>
  );
}

function ShopMarketingPopup() {
  const shopConfig = useShopConfig();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const config = shopConfig?.popup;
    if (!config?.enabled || sessionStorage.getItem('shop_popup_dismissed')) return;

    // Antes solo aparecia al pasar el 30% de scroll. En una tienda con pocos
    // productos la pagina entra entera en pantalla, no hay scroll, y el popup
    // no salia nunca. Ahora sale con lo que ocurra primero: el scroll o los
    // 8 segundos en la pagina.
    let temporizador: number | undefined;

    const mostrar = () => {
      setVisible(true);
      window.removeEventListener('scroll', checkScroll);
      if (temporizador) window.clearTimeout(temporizador);
    };

    const checkScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      if (alto <= 0) return;
      const pct = (window.scrollY / alto) * 100;
      if (pct > 30) mostrar();
    };

    temporizador = window.setTimeout(mostrar, 8000);
    window.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScroll);
      if (temporizador) window.clearTimeout(temporizador);
    };
  }, [shopConfig]);

  const config = shopConfig?.popup;
  const close = () => {
    setVisible(false);
    sessionStorage.setItem('shop_popup_dismissed', '1');
  };

  if (!config?.enabled || !visible) return null;

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

function ShopCountdownBanner() {
  const shopConfig = useShopConfig();
  const config = shopConfig?.banner;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [dismissed, setDismissed] = useState(false);

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

function ShopSocialProof() {
  const shopConfig = useShopConfig();
  const config = shopConfig?.social;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!config?.enabled || config.entries.length === 0) return;
    const startDelay = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(startDelay);
  }, [config]);

  useEffect(() => {
    if (!config?.enabled || config.entries.length === 0 || dismissed) return;
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % config.entries.length);
        setShow(true);
      }, 500);
    }, config.interval_seconds * 1000);
    return () => clearInterval(interval);
  }, [config, dismissed]);

  if (!config?.enabled || config.entries.length === 0 || dismissed || !show) return null;

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