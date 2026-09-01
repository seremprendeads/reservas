import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

type State =
  | { status: 'loading' }
  | { status: 'valid'; email: string; business_name: string; business_slug: string; expires_at: string }
  | { status: 'invalid'; message: string }
  | { status: 'already_used' };

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', message: 'Token inválido' });
      return;
    }

    supabase.functions.invoke('accept-invite', {
      method: 'GET',
      headers: { 'x-token': token },
      // La EF acepta GET con query param; usamos fetch directo para el GET
    }).then(() => {}); // dummy — usamos fetch directo abajo

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    fetch(`${SUPABASE_URL}/functions/v1/accept-invite?token=${encodeURIComponent(token)}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setState({
            status: 'valid',
            email: data.email,
            business_name: data.business_name,
            business_slug: data.business_slug,
            expires_at: data.expires_at,
          });
        } else if (data.error?.includes('utilizada')) {
          setState({ status: 'already_used' });
        } else {
          setState({ status: 'invalid', message: data.error || 'Invitación inválida o vencida' });
        }
      })
      .catch(() => {
        setState({ status: 'invalid', message: 'Error al verificar la invitación' });
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToLogin = async () => {
    // Marcar el token como usado (cosmético)
    if (token) {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${SUPABASE_URL}/functions/v1/accept-invite`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
    // Redirigir al panel admin — LoginScreen manejará el must_change_password
    navigate('/admin');
  };

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state.status === 'already_used') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
          <h1 className="mb-2 text-2xl font-display text-foreground">Invitación ya utilizada</h1>
          <p className="mb-6 text-muted-foreground">Ya accediste con esta invitación. Podés iniciar sesión directamente.</p>
          <button
            onClick={() => navigate('/admin')}
            className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ir al panel
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
          <h1 className="mb-2 text-2xl font-display text-foreground">Invitación inválida</h1>
          <p className="text-muted-foreground">{state.message}</p>
        </div>
      </div>
    );
  }

  // status === 'valid'
  const expiresDate = new Date(state.expires_at).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display text-foreground">¡Te damos la bienvenida!</h1>
          <p className="mt-2 text-muted-foreground">Tu acceso a BookingBio está listo</p>
        </div>

        <Card className="border-0 shadow-premium-lg">
          <CardContent className="p-8 space-y-5">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Negocio</span>
                <span className="font-semibold text-foreground">{state.business_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email de acceso</span>
                <span className="font-semibold text-foreground">{state.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Link vence el</span>
                <span className="font-medium text-amber-600">{expiresDate}</span>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Próximos pasos:</strong>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Hacé clic en "Acceder al panel" aquí abajo</li>
                  <li>Ingresá con el email <strong>{state.email}</strong> y la contraseña que te dieron</li>
                  <li>El sistema te va a pedir que crees tu propia contraseña</li>
                  <li>¡Listo! Tu período de prueba de 18 días comienza ahora</li>
                </ol>
              </AlertDescription>
            </Alert>

            <button
              onClick={handleGoToLogin}
              className="w-full rounded-xl bg-primary px-6 py-4 font-semibold text-white text-base transition hover:opacity-90"
            >
              Acceder al panel →
            </button>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">by bookingBio</p>
      </div>
    </div>
  );
}