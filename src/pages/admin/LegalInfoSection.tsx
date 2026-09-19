import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Save, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { useBusiness } from '../../contexts/BusinessContext';
import { useModuleAccess } from '../../modules/subscription';
import { LegalFooterLinks } from '../../components/legal/LegalFooterLinks';
import { authInvoke } from './helpers';
import {
  EMPTY_LEGAL_INFO,
  getMissingLegalFields,
  isArgentina,
  isValidCuit,
  isValidEmail,
  type LegalInfoFields,
} from '../../lib/legal';

function toFields(raw: Partial<Record<keyof LegalInfoFields, string | null>> | null | undefined): LegalInfoFields {
  const out = { ...EMPTY_LEGAL_INFO };
  if (!raw) return out;
  (Object.keys(out) as (keyof LegalInfoFields)[]).forEach((k) => {
    out[k] = raw[k] || '';
  });
  return out;
}

export function LegalInfoSection({ adminEmail, showSuccess }: { adminEmail: string; showSuccess: (msg: string) => void }) {
  const { business } = useBusiness();
  const { isModuleEnabled } = useModuleAccess();
  // Solo se exige CUIT si el negocio cobra online
  const sellsOnline = isModuleEnabled('reservas') || isModuleEnabled('shop');
  const [form, setForm] = useState<LegalInfoFields>(EMPTY_LEGAL_INFO);
  const [saved, setSaved] = useState<LegalInfoFields>(EMPTY_LEGAL_INFO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailPrefilled, setEmailPrefilled] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    authInvoke('admin-legal-info', { action: 'get' })
      .then(({ data, error: fnError }) => {
        if (!active) return;
        if (fnError || !data?.success) {
          setLoadError(data?.error || 'No se pudieron cargar los datos legales.');
          return;
        }
        const current = toFields(data.legal_info);
        setSaved(current);
        // Reutiliza el email de acceso como sugerencia. No se guarda hasta que el profesional confirme.
        if (!current.contact_email && adminEmail) {
          setForm({ ...current, contact_email: adminEmail });
          setEmailPrefilled(true);
        } else {
          setForm(current);
        }
      })
      .catch(() => { if (active) setLoadError('No se pudieron cargar los datos legales.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [adminEmail]);

  const missing = useMemo(
    () => getMissingLegalFields(business?.name, saved, sellsOnline),
    [business?.name, saved, sellsOnline],
  );

  const update = (key: keyof LegalInfoFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'contact_email') setEmailPrefilled(false);
  };

  const handleSave = async () => {
    setError('');
    const email = form.contact_email.trim();
    if (email && !isValidEmail(email)) {
      setError('Ingresá un email de contacto válido');
      return;
    }
    if (form.tax_id.trim() && isArgentina(form.country) && !isValidCuit(form.tax_id)) {
      setError('El CUIT debe tener 11 números');
      return;
    }

    setSaving(true);
    try {
      const { data, error: fnError } = await authInvoke('admin-legal-info', { action: 'update', ...form });
      if (fnError || !data?.success) {
        setError(data?.error || 'Error al guardar los datos legales');
        return;
      }
      const current = toFields(data.legal_info);
      setSaved(current);
      setForm(current);
      setEmailPrefilled(false);
      showSuccess('Datos legales guardados');
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof LegalInfoFields, label: string, placeholder: string, type = 'text') => (
    <div className="space-y-3">
      <label htmlFor={`legal-${key}`} className="text-sm font-medium text-foreground">{label}</label>
      <Input
        id={`legal-${key}`}
        type={type}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl"
        disabled={loading || !!loadError}
      />
    </div>
  );

  return (
    <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
      <CardHeader>
        <CardTitle className="font-display">Datos legales del negocio</CardTitle>
        <CardDescription>
          Estos datos se utilizarán para generar automáticamente la información legal visible en tu página pública.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="pl-7">{loadError}</AlertDescription>
          </Alert>
        ) : !loading && (
          <Alert variant={missing.length === 0 ? 'success' : 'warning'} className="mb-6">
            {missing.length === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <div className="pl-7">
              <p className="font-semibold">Documentación legal</p>
              {missing.length === 0 ? (
                <p className="mt-1">Información del negocio completa</p>
              ) : (
                <>
                  <p className="mt-1">Faltan datos para completar la información legal:</p>
                  <p className="mt-1">{missing.join(', ')}.</p>
                </>
              )}
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="pl-7">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Nombre comercial</p>
            <p className="text-sm text-muted-foreground">
              {business?.name || 'Sin nombre'} · Se toma de “Nombre del negocio”.
            </p>
          </div>

          {field('legal_name', 'Titular o razón social', 'Juan Pérez o Ejemplo S.R.L.')}
          {field('tax_id', sellsOnline ? 'CUIT' : 'CUIT (opcional)', '20-12345678-9')}
          {field('address', 'Domicilio', 'Av. Corrientes 1234, piso 2')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('city', 'Ciudad o localidad', 'San Isidro')}
            {field('province', 'Provincia', 'Buenos Aires')}
          </div>

          {field('country', 'País', 'Argentina')}

          <Separator />

          <div className="space-y-3">
            {field('contact_email', 'Email de contacto', 'contacto@tunegocio.com', 'email')}
            {emailPrefilled && (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Completamos este campo con tu email de acceso. Se va a mostrar en tus páginas legales: cambialo si preferís usar otro.
              </p>
            )}
          </div>
          {field('phone', 'Teléfono (opcional)', '+54 11 1234-5678', 'tel')}

          <Button onClick={handleSave} disabled={saving || loading || !!loadError} size="lg" className="w-full gap-1.5 transition-all duration-200">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar datos legales'}
          </Button>

          {business?.slug && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Ver documentos:</span>
              <LegalFooterLinks slug={business.slug} newTab linkClassName="text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
