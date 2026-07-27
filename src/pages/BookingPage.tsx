import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar } from '../components/Calendar';
import { BookingForm } from '../components/BookingForm';
import { Payment } from '../components/Payment';
import { Confirmation } from '../components/Confirmation';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { MapPin, Check, Store, Tag } from 'lucide-react';
import { supabase, Branding, Service } from '../lib/supabase';
import { useBusiness } from '../contexts/BusinessContext';
import { useModuleAccess, ModuleBlockedScreen } from '../modules/subscription';

function formatPrice(amount: number, currency: string) {
  return `$${amount.toLocaleString('es-AR')} ${currency}`;
}

function ServiceCards({ services, onSelect }: { services: Service[]; onSelect: (s: Service) => void }) {
  const { bookingData } = useBooking();
  const isSingle = services.length === 1;
  const gridCols = services.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <h2 className="text-2xl font-bold text-booking-text mb-2 text-center font-display">Elegí tu servicio</h2>
      <p className="text-sm text-booking-caption mb-8 text-center">Seleccioná el servicio que querés reservar</p>
      <div className={`${isSingle ? 'flex flex-wrap justify-center' : `grid ${gridCols}`} gap-6`}>
        {services.map((s) => {
          const isSelected = bookingData.service?.id === s.id;
          return (
            <div key={s.id}
              className={`relative text-center rounded-2xl transition-all duration-200 flex flex-col overflow-hidden ${
                isSingle ? 'w-full sm:max-w-md' : 'w-full'
              } ${
                isSelected
                  ? 'border-2 border-booking-primary bg-booking-primary-light shadow-[0_8px_30px_rgba(0,0,0,.05)]'
                  : 'bg-booking-card shadow-[0_8px_30px_rgba(0,0,0,.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,.08)]'
              }`}>
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-booking-primary flex items-center justify-center z-10">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {s.image_url && (
                <img src={s.image_url} alt={s.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-8 flex flex-col flex-1 items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: isSelected ? 'var(--booking-primary)' : 'var(--booking-primary)20' }}>
                  <Tag className="w-6 h-6" style={{ color: isSelected ? '#fff' : 'var(--booking-primary)' }} />
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1 font-display" style={{ color: isSelected ? 'var(--booking-primary)' : 'var(--booking-text)' }}>{s.name}</h3>
                {s.description && (
                  <p className="text-sm mb-4" style={{ color: 'var(--booking-text-muted)' }}>{s.description}</p>
                )}
                <p className="text-xl font-bold mb-4" style={{ color: isSelected ? 'var(--booking-primary)' : 'var(--booking-text)' }}>
                  {formatPrice(s.price, s.currency)}
                </p>
                <button onClick={() => onSelect(s)} className={`mt-auto w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-booking-primary text-white cursor-default'
                    : 'bg-booking-primary text-white hover:opacity-90'
                }`}>
                  {isSelected ? 'Seleccionado' : 'Elegir'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingContent() {
  const { step, setStep, bookingData, setSelectedService } = useBooking();
  const { slug } = useParams<{ slug: string }>();
  const { business, setBusinessBySlug } = useBusiness();
  const { isModuleEnabled } = useModuleAccess();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (slug && !business?.id) {
      setBusinessBySlug(slug);
    }
  }, [slug, business?.id, setBusinessBySlug]);

  if (business && !isModuleEnabled('reservas')) {
    return <ModuleBlockedScreen moduleId="reservas" />;
  }

  useEffect(() => {
    if (!document.getElementById('mp-sdk')) {
      const script = document.createElement('script');
      script.id = 'mp-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!business?.id) return;
    Promise.all([
      supabase.from('branding').select('*').eq('business_id', business.id).maybeSingle(),
      supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true).order('sort_order'),
    ]).then(([brandingRes, servicesRes]) => {
      if (brandingRes.data) setBranding(brandingRes.data as Branding);
      if (servicesRes.data) setServices(servicesRes.data);
    });
  }, [business?.id]);

  const b = branding;
  const primaryColor = b?.primary_color || '#059669';
  const primaryHover = b?.primary_color ? (() => {
    const num = parseInt(b.primary_color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - 30);
    const g = Math.max(0, ((num >> 8) & 0xFF) - 30);
    const b2 = Math.max(0, (num & 0xFF) - 30);
    return `#${(r << 16 | g << 8 | b2).toString(16).padStart(6, '0')}`;
  })() : '#047857';
  const bgColor = b?.background_color || '#111827';
  const cardBg = b?.card_bg_color || '#1f2937';
  const headerColor = b?.header_color || cardBg;
  const headerOpacity = b?.header_opacity ?? 26;
  const textColor = b?.text_color || '#ffffff';
  const mutedColor = b?.muted_color || '#e6e6e6';
  const captionColor = b?.caption_color || '#e6e6e6';
  const logoUrl = b?.logo_url || '';
  const title = b?.title || 'Reserva tu Turno';
  const subtitle = b?.subtitle || 'Sistema de Reserva';
  const bgImageUrl = b?.background_image_url || '';
  const bgOpacity = b?.bg_opacity ?? 80;
  const overlayColor = b?.overlay_color || b?.background_color || '#111827';

  useEffect(() => {
    if (b) {
      const root = document.documentElement;
      const primaryLight = primaryColor + '1a';
      root.style.setProperty('--booking-primary', primaryColor);
      root.style.setProperty('--booking-primary-hover', primaryHover);
      root.style.setProperty('--booking-primary-light', primaryLight);
      root.style.setProperty('--booking-bg', bgColor);
      root.style.setProperty('--booking-card-bg', cardBg);
      root.style.setProperty('--booking-text', textColor);
      root.style.setProperty('--booking-text-muted', mutedColor);
      root.style.setProperty('--booking-caption', captionColor);
      root.style.setProperty('--booking-border', mutedColor + '33');
      root.style.setProperty('--booking-ring', primaryColor);
      root.style.setProperty('--booking-input-bg', cardBg);
      root.style.setProperty('--booking-success', '#22c55e');
      root.style.setProperty('--booking-warning', '#f59e0b');
      root.style.setProperty('--booking-error', '#ef4444');
    }
  }, [b]); // eslint-disable-line react-hooks/exhaustive-deps

  const stepIndex = ['services', 'calendar', 'form', 'payment', 'confirmation'];
  const stepLabels = ['Servicio', 'Fecha y hora', 'Tus datos', 'Pago', 'Confirmación'];

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('calendar');
  };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Fondo global detrás de todo */}
      {bgImageUrl && (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImageUrl})` }}>
          <div className="absolute inset-0" style={{ backgroundColor: `${overlayColor}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}` }} />
        </div>
      )}

      {/* Header fijo con blur */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-black/5" style={{
        backgroundColor: `${headerColor}${Math.round((headerOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
      }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: primaryColor }}>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            )}
            <div>
              <span className="text-xl font-bold font-display" style={{ color: textColor }}>{title}</span>
              {subtitle && <p className="text-sm" style={{ color: mutedColor }}>{subtitle}</p>}
            </div>
          </div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a
            href="/tienda"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
            style={{
              backgroundColor: primaryColor,
              color: '#ffffff',
              boxShadow: `0 2px 8px ${primaryColor}40`,
            }}
          >
            Tienda
            <Store className="w-4 h-4" />
            </a>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 relative">
        <div className="relative z-10">
          {/* Progress Steps - solos si hay servicio seleccionado */}
          {bookingData.service && (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full">
              <div className="flex items-center justify-center gap-1 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto px-2">
                {['services', 'calendar', 'form', 'payment', 'confirmation'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-semibold shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: step === s || stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb',
                        color: step === s || stepIndex.indexOf(step) > i ? '#fff' : '#6b7280'
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < 4 && (
                      <div className="w-6 sm:w-16 h-1 mx-1 sm:mx-2 rounded-full transition-all duration-200"
                        style={{ backgroundColor: stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-3 sm:gap-6 text-[10px] sm:text-sm mb-6 sm:mb-8 flex-wrap px-2 text-center" style={{ color: captionColor }}>
                {stepLabels.map((label, i) => (
                  <span key={label} className="whitespace-nowrap" style={{ fontWeight: stepIndex.indexOf(step) === i ? 600 : 400, color: stepIndex.indexOf(step) === i ? primaryColor : captionColor }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-6 pb-16 w-full overflow-hidden">
            {step === 'services' && (
              <ServiceCards services={services} onSelect={handleSelectService} />
            )}
            {step === 'calendar' && <Calendar />}
            {step === 'form' && <BookingForm />}
            {step === 'payment' && <Payment />}
            {step === 'confirmation' && <Confirmation />}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-5 border-t" style={{ backgroundColor: cardBg, borderColor: `${textColor}10` }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: captionColor }}>
            <MapPin className="w-3 h-3" />
            Buenos Aires, Argentina
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: captionColor }}>
              Pagos seguros con Mercado Pago
            </p>
            <a href="https://bookingbio.com" target="_blank" rel="noopener noreferrer" className="text-sm font-black tracking-tight opacity-30 hover:opacity-60 transition-opacity" style={{ color: captionColor }}>
              by BookingBio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function BookingPage() {
  return (
    <BookingProvider>
      <BookingContent />
    </BookingProvider>
  );
}
