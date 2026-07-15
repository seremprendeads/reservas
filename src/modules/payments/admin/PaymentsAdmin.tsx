import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Unplug,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { PaymentProvider } from '../types';
import { PAYMENT_PROVIDERS } from '../config';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';

export function PaymentsAdmin() {
  const { business } = useBusiness();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail] = useState(sessionStorage.getItem('admin_email') || '');
  const [adminPassword] = useState(sessionStorage.getItem('admin_password') || '');

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-payments', {
        body: { email: adminEmail, password: adminPassword, action: 'list' },
      });
      if (data?.success) {
        setProviders(data.providers || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [adminEmail, adminPassword]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configuración de Pagos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conectá tus propias cuentas de proveedores de pago. Cada credencial es privada y pertenece a tu negocio.
        </p>
      </div>

      {PAYMENT_PROVIDERS.map((config) => {
        const provider = providers.find((p) => p.provider === config.slug);
        return (
          <ProviderCard
            key={config.slug}
            config={config}
            provider={provider || null}
            onRefresh={loadProviders}
            adminEmail={adminEmail}
            adminPassword={adminPassword}
          />
        );
      })}
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────

function ProviderCard({
  config,
  provider,
  onRefresh,
  adminEmail,
  adminPassword,
}: {
  config: typeof PAYMENT_PROVIDERS[number];
  provider: PaymentProvider | null;
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
}) {
  const isConnected = provider?.status === 'connected';
  const [showToken, setShowToken] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    if (provider) {
      const initial: Record<string, string> = {};
      config.fields.forEach((f) => {
        initial[f.key] = provider[f.key as keyof PaymentProvider] as string || '';
      });
      setFields(initial);
    }
  }, [provider, config.fields]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-payments', {
        body: {
          email: adminEmail,
          password: adminPassword,
          action: 'save',
          provider: config.slug,
          credentials: fields,
        },
      });
      if (data?.success) {
        setMessage({ type: 'success', text: 'Credenciales guardadas correctamente.' });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: data?.error || 'Error al guardar.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-payments', {
        body: {
          email: adminEmail,
          password: adminPassword,
          action: 'test',
          provider: config.slug,
        },
      });
      if (data?.success) {
        setMessage({ type: 'success', text: 'Conexión verificada exitosamente.' });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: data?.error || 'La conexión falló. Verificá las credenciales.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al probar la conexión.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-payments', {
        body: {
          email: adminEmail,
          password: adminPassword,
          action: 'disconnect',
          provider: config.slug,
        },
      });
      if (data?.success) {
        setMessage({ type: 'success', text: 'Proveedor desconectado.' });
        setShowDisconnectDialog(false);
        onRefresh();
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al desconectar.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDelete = async () => {
    setDisconnecting(true);
    try {
      const { data } = await supabase.functions.invoke('admin-manage-payments', {
        body: {
          email: adminEmail,
          password: adminPassword,
          action: 'delete',
          provider: config.slug,
        },
      });
      if (data?.success) {
        setMessage({ type: 'success', text: 'Configuración eliminada.' });
        setShowDisconnectDialog(false);
        setFields({});
        onRefresh();
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar.' });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} text-xl text-white shadow-md`}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-base">{config.name}</CardTitle>
                <CardDescription className="mt-0.5 text-xs">{config.description}</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'success' : 'destructive'} className="shrink-0">
              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isConnected ? 'Conectado' : 'No conectado'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
              <div className="relative">
                <Input
                  type={field.type === 'password' && !showToken ? 'password' : 'text'}
                  value={fields[field.key] || ''}
                  onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="pr-20 font-mono text-xs"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {config.helpUrl && (
            <a
              href={config.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {config.helpLabel}
            </a>
          )}

          <Separator />

          {message && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Guardar
            </Button>

            {config.slug !== 'crypto' && (
              <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !hasAnyValue(fields)}>
                {testing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Probar conexión
              </Button>
            )}

            {isConnected && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={disconnecting}
              >
                <Unplug className="mr-1.5 h-3.5 w-3.5" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar {config.name}</DialogTitle>
            <DialogDescription>
              Se marcará el proveedor como desconectado. Tus credenciales se mantendrán guardadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowDisconnectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={disconnecting}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar credenciales
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function hasAnyValue(fields: Record<string, string>): boolean {
  return Object.values(fields).some((v) => v.trim().length > 0);
}
