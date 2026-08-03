import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveLoginSession } from '../../lib/admin-session';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function LoginScreen({ onLogin }: { onLogin: (email: string, token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      const { data } = await supabase.functions.invoke('admin-forgot-password', {
        body: { email: cleanEmail },
      });
      if (data?.temp_password) {
        setSuccess(`Tu contraseña temporal es: ${data.temp_password}. Usala para ingresar.`);
      } else {
        setSuccess('Si el email existe, te enviamos una contraseña temporal. Revisá tu bandeja de entrada.');
      }
    } catch {
      setError('Error al enviar el email. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
