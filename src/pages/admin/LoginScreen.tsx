import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveLoginSession } from '../../lib/admin-session';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { authInvoke } from './helpers';

type Mode = 'login' | 'forgot' | 'change_password';

interface LoginScreenProps {
  onLogin: (email: string, token: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Guardamos el token temporal mientras se espera el cambio de contraseña obligatorio
  const [pendingToken, setPendingToken] = useState('');
  const [pendingLoginData, setPendingLoginData] = useState<{
    email: string; name: string; business_id: string; trial_ends_at: string | null;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-login', {
        body: { email: cleanEmail, password },
      });
      if (fnError || !data?.success) {
        setError('Email o contraseña incorrectos');
      } else if (data.must_change_password) {
        // Contraseña temporal — forzar cambio antes de permitir el acceso al panel
        setPendingToken(data.token);
        setPendingLoginData({
          email: cleanEmail,
          name: data.name || '',
          business_id: data.business_id,
          trial_ends_at: data.trial_ends_at,
        });
        setPassword('');
        setMode('change_password');
      } else {
        saveLoginSession({
          email: cleanEmail,
          token: data.token,
          name: data.name || '',
          businessId: data.business_id,
          trialEndsAt: data.trial_ends_at,
        });
        onLogin(cleanEmail, data.token);
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      await supabase.functions.invoke('admin-forgot-password', {
        body: { email: cleanEmail },
      });
      // Respuesta genérica siempre — no revelar si el email existe
      setSuccess('Si el email existe en el sistema, te enviamos una contraseña temporal. Revisá tu bandeja de entrada.');
    } catch {
      setError('Error al enviar el email. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      // Llamamos admin-update-profile con el token temporal para cambiar la contraseña
      // y limpiar must_change_password en el backend
      const { data, error: fnError } = await supabase.functions.invoke('admin-update-profile', {
        headers: { Authorization: `Bearer ${pendingToken}` },
        body: { newPassword },
      });
      if (fnError || (data && !data.success && data.error)) {
        setError(data?.error || 'Error al cambiar la contraseña');
        return;
      }
      // Cambio exitoso — guardar sesión y entrar al panel
      if (pendingLoginData) {
        saveLoginSession({
          email: pendingLoginData.email,
          token: pendingToken,
          name: pendingLoginData.name,
          businessId: pendingLoginData.business_id,
          trialEndsAt: pendingLoginData.trial_ends_at || undefined,
        });
        onLogin(pendingLoginData.email, pendingToken);
      }
    } catch {
      setError('Error al cambiar la contraseña. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de cambio obligatorio de contraseña ─────────────────────────
  if (mode === 'change_password') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-display text-foreground">Creá tu contraseña</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Por seguridad, necesitás crear una contraseña propia antes de continuar.
            </p>
          </div>
          <Card className="border-0 shadow-premium-lg">
            <CardContent className="p-10">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="h-13 pr-12 text-base"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">Confirmá la contraseña</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repetí la contraseña"
                    className="h-13 text-base"
                  />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="w-full h-14 py-6 text-base">
                  {loading ? 'Guardando...' : 'Guardar y entrar al panel'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Login y recuperación ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-display text-foreground">
            {mode === 'login' ? 'Bienvenido' : 'Recuperar contraseña'}
          </h1>
          <p className="mt-3 text-sm text-foreground/70">
            {mode === 'login' ? 'Ingresá a tu panel de administración' : 'Te enviamos una contraseña temporal por email'}
          </p>
        </div>

        <Card className="border-0 shadow-premium-lg">
          <CardContent className="p-10">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-6">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleForgot} className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="admin@email.com" className="h-13 text-base" />
              </div>

              {mode === 'login' && (
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">Contraseña</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="h-13 pr-12 text-base"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-sm text-primary hover:underline transition-colors duration-200">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg" className="w-full h-14 py-6 text-base">
                {loading
                  ? (mode === 'login' ? 'Ingresando...' : 'Enviando...')
                  : (mode === 'login' ? 'Ingresar' : 'Enviar contraseña temporal')}
              </Button>
            </form>

            {mode === 'forgot' && (
              <div className="mt-6 text-center">
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="text-sm font-medium text-primary hover:underline transition-colors duration-200">
                  ← Volver al login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-base font-bold text-foreground/60">by bookingBio</p>
      </div>
    </div>
  );
}