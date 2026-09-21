import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  LEGAL_DOCS,
  availableLegalDocs,
  LEGAL_TEMPLATE_UPDATED_AT,
  fetchPublicLegalInfo,
  legalPath,
  type LegalDocKey,
  type PublicLegalInfo,
} from '../../lib/legal';
import { LegalFooterLinks } from '../../components/legal/LegalFooterLinks';
import { BusinessIdentity, LegalDocument } from './documents';

function lastUpdated(infoDate: string | null): string {
  const template = new Date(`${LEGAL_TEMPLATE_UPDATED_AT}T00:00:00`);
  const info = infoDate ? new Date(infoDate) : null;
  const date = info && !isNaN(info.getTime()) && info > template ? info : template;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function LegalPage({ doc }: { doc: LegalDocKey }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [info, setInfo] = useState<PublicLegalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Documentos que aplican al negocio según su plan
  const docs = info
    ? availableLegalDocs({ reservas: info.has_reservas, shop: info.has_shop, landing: info.has_landing })
    : LEGAL_DOCS;
  const current = docs.find((d) => d.key === doc) || docs[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc, slug]);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    // El tenant se resuelve en la base de datos a partir del slug de la URL.
    fetchPublicLegalInfo(slug)
      .then((data) => { if (active) setInfo(data); })
      .catch((err) => {
        console.error('Error cargando información legal:', err);
        if (active) setFailed(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (info) document.title = `${current.title} | ${info.business_name}`;
  }, [info, current.title]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!slug || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-foreground mb-3">
            {failed ? 'No pudimos cargar este documento' : 'Negocio no encontrado'}
          </h1>
          <p className="text-muted-foreground">
            {failed
              ? 'Probá recargar la página en unos minutos.'
              : 'Revisá que la dirección sea correcta. El negocio puede no existir o no estar activo.'}
          </p>
        </div>
      </div>
    );
  }

  // location.key === 'default' significa que se entró directo por URL (sin historial en la app).
  const canGoBack = location.key !== 'default';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-4">
          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {info.logo_url ? (
            <img src={info.logo_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display text-xl shrink-0">
              {info.business_name.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-display text-xl leading-tight truncate">{info.business_name}</p>
        </div>

        <nav aria-label="Documentos legales" className="max-w-3xl mx-auto px-5 sm:px-8 pb-4">
          <div className="flex gap-2 overflow-x-auto">
            {docs.map((d) => {
              const active = d.key === current.key;
              return (
                <Link
                  key={d.key}
                  to={legalPath(info.slug, d.key)}
                  replace
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {d.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <article className="max-w-[68ch]">
          <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight">{current.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Última actualización: {lastUpdated(info.updated_at)}</p>

          <div className="mt-8">
            {/* current.key: si el plan no incluye el documento pedido, se muestra el primero disponible */}
            <LegalDocument doc={current.key} d={info} />
          </div>

          <section className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium mb-4">Datos del negocio</h2>
            <BusinessIdentity d={info} />
          </section>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Documento generado automáticamente por BiowebLink con la información que {info.business_name} cargó
            en su cuenta. No reemplaza el asesoramiento legal profesional.
          </p>
        </article>
      </main>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <LegalFooterLinks slug={info.slug} className="justify-center" linkClassName="hover:text-foreground" />
          <a href="https://bioweblink.com" target="_blank" rel="noopener noreferrer" className="font-black tracking-tight opacity-50 hover:opacity-80 transition-opacity">
            by BiowebLink
          </a>
        </div>
      </footer>
    </div>
  );
}
