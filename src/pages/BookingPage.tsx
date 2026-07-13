import { useEffect, useState } from 'react';
import { Calendar } from '../components/Calendar';
import { BookingForm } from '../components/BookingForm';
import { Payment } from '../components/Payment';
import { Confirmation } from '../components/Confirmation';
import { Button } from '../components/ui/button';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { Phone, MapPin, Check, Clock, Tag, Store } from 'lucide-react';
import { supabase, Branding, Service } from '../lib/supabase';

function formatPrice(amount: number, currency: string) {
  return `$${amount.toLocaleString('es-AR')} ${currency}`;
}

function ServiceCards({ services, onSelect }: { services: Service[]; onSelect: (s: Service) => void }) {
  const { bookingData } = useBooking();
  const isSingle = services.length === 1;
  const gridCols = services.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <h2 className="text-2xl font-bold text-booking-text mb-2 text-center">Elegí tu servicio</h2>
      <p className="text-sm text-booking-caption mb-6 text-center">Seleccioná el servicio que querés reservar</p>
      <div className={`${isSingle ? 'flex flex-wrap justify-center' : `grid ${gridCols}`} gap-4`}>
        {services.map((s) => {
          const isSelected = bookingData.service?.id === s.id;
          return (
            <div key={s.id}
              className={`relative text-left rounded-xl transition-all duration-200 flex flex-col overflow-hidden ${
                isSingle ? 'w-full sm:max-w-md' : 'w-full'
              } ${
                isSelected
                  ? 'border-2 border-booking-primary bg-booking-primary-light shadow-lg'
                  : 'bg-booking-card'
              }`}>
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-booking-primary flex items-center justify-center z-10">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {s.image_url && (
                <img src={s.image_url} alt={s.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 shrink-0" style={{ color: isSelected ? 'var(--booking-primary)' : 'var(--booking-text-muted)' }} />
                <h3 className="font-bold text-lg leading-tight" style={{ color: isSelected ? 'var(--booking-primary)' : 'var(--booking-text)' }}>{s.name}</h3>
              </div>
              {s.description && (
                <p className="text-sm mb-3" style={{ color: 'var(--booking-text-muted)' }}>{s.description}</p>
              )}
              <p className="text-xl font-bold mb-4 text-white">
                {formatPrice(s.price, s.currency)}
              </p>
              <button onClick={() => onSelect(s)} className={`mt-auto w-full py-2.5 rounded-lg font-semibold transition-colors duration-200 ${
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
  const [branding, setBranding] = useState<Branding | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!document.getElementById('mp-sdk')) {
      const script = document.createElement('script');
      script.id = 'mp-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from('branding').select('*').maybeSingle(),
      supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([brandingRes, servicesRes]) => {
      if (brandingRes.data) setBranding(brandingRes.data as Branding);
      if (servicesRes.data) setServices(servicesRes.data);
    });
  }, []);

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
  const headerOpacity = b?.header_opacity ?? 100;
  const textColor = b?.text_color || '#f3f4f6';
  const mutedColor = b?.muted_color || '#9ca3af';
  const captionColor = b?.caption_color || '#9ca3af';
  const logoUrl = b?.logo_url || '';
  const title = b?.title || 'Reserva tu Turno';
  const subtitle = b?.subtitle || 'Sistema de Reserva';
  const bgImageUrl = b?.background_image_url || '';
  const bgOpacity = b?.bg_opacity ?? 80;
  const overlayColor = b?.overlay_color || b?.background_color || '#111827';

  useEffect(() => {
    if (b) {
      const root = document.documentElement;
      root.style.setProperty('--booking-primary', primaryColor);
      root.style.setProperty('--booking-primary-hover', primaryHover);
      root.style.setProperty('--booking-bg', bgColor);
      root.style.setProperty('--booking-card-bg', cardBg);
      root.style.setProperty('--booking-text', textColor);
      root.style.setProperty('--booking-text-muted', mutedColor);
      root.style.setProperty('--booking-caption', captionColor);
    }
  }, [b]);

  const stepIndex = ['services', 'calendar', 'form', 'payment', 'confirmation'];
  const stepLabels = ['Servicio', 'Fecha y hora', 'Tus datos', 'Pago', 'Confirmación'];

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('calendar');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Header fijo con blur */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-black/5" style={{
        backgroundColor: headerColor,
        opacity: headerOpacity / 100,
      }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: primaryColor }}>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            )}
            <div>
              <span className="text-xl font-bold" style={{ color: textColor }}>{title}</span>
              {subtitle && <p className="text-sm" style={{ color: mutedColor }}>{subtitle}</p>}
            </div>
          </div>
          <a
            href="/tienda"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
            style={{
              backgroundColor: primaryColor,
              color: '#ffffff',
              boxShadow: `0 2px 8px ${primaryColor}40`,
            }}
          >
            <Store className="w-4 h-4" />
            Tienda
          </a>
        </div>
      </header>

      {/* Contenido principal con overlay solo acá */}
      <div className="flex-1 relative">
        {bgImageUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImageUrl})` }}>
            <div className="absolute inset-0" style={{ backgroundColor: `${overlayColor}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}` }} />
          </div>
        )}
        <div className="relative z-10">
          {/* Progress Steps - solos si hay servicio seleccionado */}
          {bookingData.service && (
            <div className="max-w-4xl mx-auto px-4 py-6 w-full">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto px-2">
                {['services', 'calendar', 'form', 'payment', 'confirmation'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-medium shrink-0"
                      style={{
                        backgroundColor: step === s || stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb',
                        color: step === s || stepIndex.indexOf(step) > i ? '#fff' : '#6b7280'
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < 4 && (
                      <div className="w-4 sm:w-12 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded"
                        style={{ backgroundColor: stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-2 sm:gap-4 text-[10px] sm:text-sm mb-6 sm:mb-8 flex-wrap px-2 text-center" style={{ color: captionColor }}>
                {stepLabels.map((label, i) => (
                  <span key={label} className="whitespace-nowrap" style={{ fontWeight: stepIndex.indexOf(step) === i ? 600 : 400, color: stepIndex.indexOf(step) === i ? primaryColor : captionColor }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 pb-12 w-full overflow-hidden">
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

      {/* Footer (sin overlay) */}
      <footer className="py-8" style={{ backgroundColor: cardBg }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6" style={{ color: textColor }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span style={{ color: mutedColor }}>Buenos Aires, Argentina</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: mutedColor }}>
            Pagos seguros con Mercado Pago
          </p>
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
