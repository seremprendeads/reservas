import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../contexts/BusinessContext';

export function CreateBusinessPage() {
  const navigate = useNavigate();
  const { business, setBusinessById } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adminEmail] = useState(sessionStorage.getItem('admin_email') || '');
  const [adminPassword] = useState(sessionStorage.getItem('admin_password') || '');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [currency, setCurrency] = useState('ARS');

  // If user already has a business, redirect to admin
  useEffect(() => {
    if (business?.id) {
      navigate('/admin');
    } else if (!adminEmail) {
      navigate('/admin');
    } else {
      setLoading(false);
    }
  }, [business, adminEmail, navigate]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await supabase.functions.invoke('create-business', {
        body: {
          email: adminEmail,
          password: adminPassword,
          name: name.trim(),
          slug: slug.trim(),
          currency,
        },
      });

      if (data?.success) {
        await setBusinessById(data.business_id);
        sessionStorage.setItem('admin_business_id', data.business_id);
        navigate('/admin');
      } else {
        setError(data?.error || 'Error al crear el negocio');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Crear tu negocio</h1>
          <p className="text-sm text-muted-foreground">
            Configurá los datos básicos de tu negocio para empezar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre del negocio</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Mi Negocio"
              required
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">URL del negocio</label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 bg-muted text-sm text-muted-foreground">
                {window.location.origin}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="mi-negocio"
                required
                minLength={3}
                pattern="[a-z0-9\-]+"
                className="flex-1 px-4 py-2.5 rounded-r-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solo minúsculas, números y guiones
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm bg-background"
            >
              <option value="ARS">Pesos Argentinos (ARS)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="BRL">Reales (BRL)</option>
              <option value="MXN">Pesos Mexicanos (MXN)</option>
              <option value="COP">Pesos Colombianos (COP)</option>
              <option value="CLP">Pesos Chilenos (CLP)</option>
              <option value="PEN">Soles (PEN)</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !slug.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              'Crear negocio'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
