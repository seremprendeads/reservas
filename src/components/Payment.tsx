import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, Clock, XCircle, Shield, Lock } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

export function Payment() {
  const { bookingData, setPaymentStatus, setStep } = useBooking();
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);

  const checkPaymentStatus = useCallback(async () => {
    if (!bookingData.bookingCode) return;

    setChecking(true);
    try {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_code', bookingData.bookingCode)
        .eq('business_id', business?.id || '')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (booking && booking.payment_status === 'approved') {
        setPaymentStatus('approved');
        setStep('confirmation');
        return true;
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    } finally {
      setChecking(false);
    }
    return false;
  }, [bookingData.bookingCode, business?.id, setPaymentStatus, setStep]);

  useEffect(() => {
    if (!bookingData.preferenceId) {
      setError('No se pudo crear la preferencia de pago');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      const [sdkReady, publicKey] = await Promise.all([
        waitForMpSdk(),
        getPublicKey(),
      ]);

      if (cancelled) return;

      if (!publicKey) {
        setError('No se pudo obtener la configuracion de pago');
        setLoading(false);
        return;
      }

      if (!sdkReady) {
        setError('Error al cargar Mercado Pago');
        setLoading(false);
        return;
      }

      setMpLoaded(true);
      initBrick(publicKey);
      setLoading(false);
    };

    init();

    const checkInterval = setInterval(checkPaymentStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(checkInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const waitForMpSdk = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.MercadoPago) return resolve(true);
      const check = setInterval(() => {
        if (window.MercadoPago) {
          clearInterval(check);
          resolve(true);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(false); }, 8000);
    });
  };

  const initBrick = async (publicKey: string) => {
    try {
      const container = document.getElementById('mercadopago_container');
      if (container && container.innerHTML.trim() !== '') return;

      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR'
      });

      mp.bricks().create('wallet', 'mercadopago_container', {
        initialization: {
          preferenceId: bookingData.preferenceId,
          redirectMode: 'blank'
        },
        customization: {
          theme: 'default',
          visual: {
            borderRadius: '12px',
            buttonHeight: '52px',
            style: {
              customVariables: {
                baseColor: '#009ee3',
                buttonTextColor: '#ffffff',
                borderRadiusMedium: '12px',
                borderRadiusLarge: '16px',
              },
            },
          },
        },
        callbacks: {
          onReady: () => {
            setLoading(false);
          },
          onSubmit: async () => {
            setPaymentStarted(true);
            setChecking(true);
          },
          onError: () => {
            setError('Ocurrio un error al procesar el pago');
            setChecking(false);
          }
        }
      });
    } catch (err) {
      console.error('Error initializing Mercado Pago:', err);
      setError('Error al inicializar Mercado Pago');
    }
  };

  const getPublicKey = async (): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke('get-mp-config', {
      method: 'POST',
      body: { business_slug: business?.slug },
    });
    if (error) {
      console.error('Error getting MP config:', error);
      return null;
    }
    return data?.publicKey || null;
  };

  if (loading) {
    return (
      <div className="max-w-xl py-24 mx-auto text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-booking-primary animate-spin" />
        <p className="text-booking-muted">Preparando el pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4">
        <div className="p-8 text-center bg-white shadow-[0_8px_30px_rgba(0,0,0,.05)] rounded-2xl">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800 font-display">Error</h2>
          <p className="mb-6 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 font-semibold text-white transition-all duration-200 bg-booking-primary rounded-xl hover:bg-booking-primary-hover"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="p-8 bg-white shadow-[0_8px_30px_rgba(0,0,0,.05)] rounded-2xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-full bg-booking-primary-light">
            <CreditCard className="w-8 h-8 text-booking-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800 font-display">Confirmar tu reserva</h2>
          <p className="text-gray-600">
            Para confirmar tu turno debes completar el pago
          </p>
        </div>

        <div className="p-5 mb-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Fecha</span>
            <span className="font-medium text-gray-800">
              {bookingData.date?.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-sm">Hora</span>
            <span className="font-medium text-gray-800">{bookingData.time} hs</span>
          </div>
          {bookingData.service?.name && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-gray-500 text-sm">Servicio</span>
              <span className="font-medium text-gray-800">{bookingData.service.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-2xl font-bold text-booking-primary">
              ${bookingData.amount.toLocaleString('es-AR')} {bookingData.currency}
            </span>
          </div>
        </div>

        {checking && (
          <div className="flex items-center gap-3 p-4 mb-6 border border-yellow-200 bg-yellow-50 rounded-xl">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <p className="text-yellow-700 text-sm">Verificando estado del pago...</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-center text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Elegí cómo pagar</p>
          <div id="mercadopago_container" className="min-h-[80px]">
            {!mpLoaded && (
              <div className="py-6 text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-2 text-booking-primary animate-spin" />
                <p className="text-gray-400 text-sm">Cargando opciones de pago...</p>
              </div>
            )}
          </div>
        </div>

        {paymentStarted && (
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="flex items-center justify-center w-full gap-2 py-3.5 mt-2 font-medium text-gray-600 transition-all duration-200 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 text-sm"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Ya realicé el pago
              </>
            )}
          </button>
        )}

        <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Datos protegidos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
