import { useState, useEffect, useCallback } from 'react';
import { CreditCard, AlertCircle, Check, Loader2, Clock, XCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { supabase, Booking } from '../lib/supabase';

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

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      setMpLoaded(true);
      setLoading(false);

      setTimeout(() => {
        initMercadoPago();
      }, 100);
    };
    script.onerror = () => {
      setError('Error al cargar Mercado Pago');
      setLoading(false);
    };
    document.head.appendChild(script);

    const checkInterval = setInterval(checkPaymentStatus, 10000);

    return () => {
      clearInterval(checkInterval);
      document.head.removeChild(script);
    };
  }, []);

  const initMercadoPago = async () => {
    try {
      const publicKey = await getPublicKey();

      if (!publicKey) {
        setError('No se pudo obtener la configuracion de pago');
        return;
      }

      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR'
      });

      mp.bricks().create('wallet_container', 'mercadopago_container', {
        initialization: {
          preferenceId: bookingData.preferenceId,
          redirectMode: 'blank'
        },
        callbacks: {
          onReady: () => {
            setLoading(false);
          },
          onSubmit: async () => {
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
      <div className="max-w-xl mx-auto text-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Preparando el pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold
              hover:bg-emerald-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirmar tu reserva</h2>
          <p className="text-gray-600">
            Para confirmar tu turno debes completar el pago
          </p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Fecha:</span>
            <span className="font-medium">
              {bookingData.date?.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-700">Hora:</span>
            <span className="font-medium">{bookingData.time} hs</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="font-bold text-emerald-600 text-xl">
              ${bookingData.bookingCode ? '1,000' : '0'} ARS
            </span>
          </div>
        </div>

        {checking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <p className="text-yellow-700">Verificando estado del pago...</p>
          </div>
        )}

        <div id="mercadopago_container" className="min-h-[100px]">
          {!mpLoaded && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Cargando opciones de pago...</p>
            </div>
          )}
        </div>

        <button
          onClick={checkPaymentStatus}
          disabled={checking}
          className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium
            hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Ya realize el pago
            </>
          )}
        </button>
      </div>
    </div>
  );
}
