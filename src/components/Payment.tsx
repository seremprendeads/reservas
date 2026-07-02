import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, Clock, XCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function Payment() {
  const { bookingData, setPaymentStatus, setStep } = useBooking();
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
  }, [bookingData.bookingCode, setPaymentStatus, setStep]);

  useEffect(() => {
    if (!bookingData.preferenceId) {
      setError('No se pudo crear la preferencia de pago');
      setLoading(false);
      return;
    }

    // Evitar cargar el script dos veces
    if (document.getElementById('mp-sdk')) {
      initMercadoPago();
      setMpLoaded(true);
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.id = 'mp-sdk';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      setMpLoaded(true);
      setLoading(false);
      initMercadoPago();
    };
    script.onerror = () => {
      setError('Error al cargar Mercado Pago');
      setLoading(false);
    };
    document.head.appendChild(script);

    const checkInterval = setInterval(checkPaymentStatus, 10000);

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  const initMercadoPago = async () => {
    try {
      // Evitar inicializar si el container ya tiene contenido
      const container = document.getElementById('mercadopago_container');
      if (container && container.innerHTML.trim() !== '') return;

      const publicKey = await getPublicKey();

      if (!publicKey) {
        setError('No se pudo obtener la configuracion de pago');
        return;
      }

      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR'
      });

      mp.bricks().create('wallet', 'mercadopago_container', {
        initialization: {
          preferenceId: bookingData.preferenceId,
          redirectMode: 'blank'
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
    const { data, error } = await supabase.functions.invoke('get-mp-config');
    if (error) {
      console.error('Error getting MP config:', error);
      return null;
    }
    return data?.publicKey || null;
  };

  if (loading) {
    return (
      <div className="max-w-xl py-20 mx-auto text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-600 animate-spin" />
        <p className="text-gray-600">Preparando el pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="p-8 text-center bg-white shadow-lg rounded-2xl">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">Error</h2>
          <p className="mb-6 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 font-semibold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="p-8 bg-white shadow-lg rounded-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100">
            <CreditCard className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Confirmar tu reserva</h2>
          <p className="text-gray-600">
            Para confirmar tu turno debes completar el pago
          </p>
        </div>

        <div className="p-4 mb-6 bg-emerald-50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Fecha:</span>
            <span className="font-medium">
              {bookingData.date?.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-700">Hora:</span>
            <span className="font-medium">{bookingData.time} hs</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-emerald-200">
            <span className="font-medium text-gray-700">Total:</span>
            <span className="text-xl font-bold text-emerald-600">
              ${bookingData.amount.toLocaleString('es-AR')} {bookingData.currency}
            </span>
          </div>
        </div>

        {checking && (
          <div className="flex items-center gap-3 p-4 mb-6 border border-yellow-200 bg-yellow-50 rounded-xl">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <p className="text-yellow-700">Verificando estado del pago...</p>
          </div>
        )}

        <div id="mercadopago_container" className="min-h-[100px]">
          {!mpLoaded && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 animate-spin" />
              <p className="text-gray-500">Cargando opciones de pago...</p>
            </div>
          )}
        </div>

        {paymentStarted && (
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="flex items-center justify-center w-full gap-2 py-3 mt-6 font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
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
      </div>
    </div>
  );
}
