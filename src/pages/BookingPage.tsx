import { useEffect, useState } from 'react';
import { Calendar } from '../components/Calendar';
import { BookingForm } from '../components/BookingForm';
import { Payment } from '../components/Payment';
import { Confirmation } from '../components/Confirmation';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { Phone, MapPin } from 'lucide-react';
import { supabase, Branding } from '../lib/supabase';

function BookingContent() {
  const { step } = useBooking();
  const [branding, setBranding] = useState<Branding | null>(null);

  useEffect(() => {
    if (!document.getElementById('mp-sdk')) {
      const script = document.createElement('script');
      script.id = 'mp-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    supabase
      .from('branding')
      .select('*')
      .maybeSingle()
      .then(({ data, error }) => {
        console.log('Branding data:', data, 'Error:', error);
        if (data) setBranding(data as Branding);
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
  const textColor = b?.text_color || '#f3f4f6';
  const mutedColor = b?.muted_color || '#9ca3af';
  const logoUrl = b?.logo_url || '';
  const title = b?.title || 'Reserva tu Turno';
  const subtitle = b?.subtitle || 'Sistema de Reserva';
  const bgImageUrl = b?.background_image_url || '';

  useEffect(() => {
    if (b) {
      const root = document.documentElement;
      root.style.setProperty('--booking-primary', primaryColor);
      root.style.setProperty('--booking-primary-hover', primaryHover);
      root.style.setProperty('--booking-bg', bgColor);
      root.style.setProperty('--booking-card-bg', cardBg);
      root.style.setProperty('--booking-text', textColor);
      root.style.setProperty('--booking-text-muted', mutedColor);
    }
  }, [b]);

  const stepIndex = ['calendar', 'form', 'payment', 'confirmation'];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Header (sin overlay) */}
      <header style={{ backgroundColor: cardBg }}>
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
        </div>
      </header>

      {/* Contenido principal con overlay solo acá */}
      <div className="flex-1 relative">
        {bgImageUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImageUrl})` }}>
            <div className="absolute inset-0" style={{ backgroundColor: `${bgColor}cc` }} />
          </div>
        )}
        <div className="relative z-10">
          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto px-4 py-6 w-full">
            <div className="flex items-center justify-center gap-2 mb-8">
              {['calendar', 'form', 'payment', 'confirmation'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: step === s || stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb',
                      color: step === s || stepIndex.indexOf(step) > i ? '#fff' : '#6b7280'
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < 3 && (
                    <div className="w-12 h-1 mx-2 rounded"
                      style={{ backgroundColor: stepIndex.indexOf(step) > i ? primaryColor : '#e5e7eb' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 text-sm mb-8" style={{ color: mutedColor }}>
              {['Fecha y hora', 'Tus datos', 'Pago', 'Confirmación'].map((label, i) => (
                <span key={label} style={{ fontWeight: stepIndex.indexOf(step) === i ? 600 : 400, color: stepIndex.indexOf(step) === i ? primaryColor : mutedColor }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 pb-12 w-full">
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
