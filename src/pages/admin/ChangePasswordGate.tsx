import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { authInvoke } from './helpers';
import * as session from '../../lib/admin-session';

// ============================================================================
// ChangePasswordGate
//
// Se muestra en lugar del panel cuando admin-login devolvio
// must_change_password = true, es decir cuando la clave sigue siendo la
// temporal que se entrego con la invitacion.
//
// No hay forma de saltearla: la unica salida es cambiar la clave o cerrar
// sesion. El guardado usa admin-update-profile, que ya baja la marca en la
// base al cambiar la contrasena.
// ============================================================================

export function ChangePasswordGate({ onDone, onLogout }: { onDone: () => void; onLogout: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await authInvoke('admin-update-profile', {
        newPassword: password,
      });
      if (fnError || !data?.success) {
        setError('No se pudo cambiar la contraseña. Intentá de nuevo.');
        return;
      }
      session.clearMustChangePassword();
      onDone();
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.06)] p-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          Creá tu contraseña
        </h1>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Estás usando la contraseña temporal que te dimos al activar tu cuenta.
          Elegí una propia para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nueva contraseña</label>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repetir contraseña</label>
            <Input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Escribila de nuevo"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar y entrar'}
          </Button>
        </form>

        <button
          onClick={onLogout}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}