import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // For logged-in users: auto-accept
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'checking' | 'login' | 'register'>('checking');

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    // Check if user is already logged in via sessionStorage
    const storedEmail = sessionStorage.getItem('admin_email');
    const storedPassword = sessionStorage.getItem('admin_password');

    if (storedEmail && storedPassword) {
      // Auto-accept for logged-in users
      acceptInvite(storedEmail, storedPassword);
    } else {
      setMode('login');
      setLoading(false);
    }
  }, [token]);

  const acceptInvite = async (emailAddr: string, pass: string) => {
    try {
      const { data } = await supabase.functions.invoke('admin-accept-invite', {
        body: { email: emailAddr, password: pass, token },
      });

      if (data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/admin'), 2000);
      } else {
        setError(data?.error || 'Error al aceptar invitación');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    await acceptInvite(email, password);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold">Invitación aceptada</h1>
          <p className="text-muted-foreground">Redirigiendo al panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Enlace no válido</h1>
          <p className="text-muted-foreground">El enlace de invitación no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Unirse al negocio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Iniciá sesión o creá una cuenta para aceptar la invitación
          </p>
        </div>

        {mode === 'register' ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              const { data } = await supabase.functions.invoke('admin-register', {
                body: { name: email.split('@')[0], email, password, invite_token: token },
              });
              if (data?.success) {
                setSuccess(true);
                sessionStorage.setItem('admin_email', email);
                sessionStorage.setItem('admin_password', password);
                setTimeout(() => navigate('/admin'), 2000);
              } else {
                setError(data?.error || 'Error al registrar');
              }
            } catch {
              setError('Error de conexión');
            } finally {
              setSubmitting(false);
            }
          }} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
            />
            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Crear cuenta y unirse'}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
                Iniciar sesión
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Aceptar invitación'}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline">
                Crear cuenta
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
