import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_DOCS, availableLegalDocs, legalPath, fetchPublicSlugById, fetchPublicLegalInfo } from '../../lib/legal';

interface LegalFooterLinksProps {
  // Slug del negocio. Se usa directamente si no hay businessId.
  slug?: string | null;
  // Si se pasa, el slug se resuelve desde public_businesses por id
  // (fuente de verdad del negocio). El slug queda como respaldo.
  businessId?: string | null;
  className?: string;
  style?: React.CSSProperties;
  linkClassName?: string;
  newTab?: boolean;
}

export function LegalFooterLinks({ slug, businessId, className = '', style, linkClassName = '', newTab = false }: LegalFooterLinksProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [docs, setDocs] = useState(LEGAL_DOCS);

  useEffect(() => {
    let active = true;
    setResolvedSlug(null);
    if (!businessId) return;
    fetchPublicSlugById(businessId).then((s) => {
      if (active) setResolvedSlug(s);
    });
    return () => { active = false; };
  }, [businessId]);

  const finalSlug = resolvedSlug || slug;

  // Los documentos que aplican dependen del plan del negocio
  useEffect(() => {
    let active = true;
    if (!finalSlug) return;
    fetchPublicLegalInfo(finalSlug)
      .then((info) => {
        if (!active || !info) return;
        setDocs(availableLegalDocs({ reservas: info.has_reservas, shop: info.has_shop, landing: info.has_landing }));
      })
      .catch(() => { /* ante un error se muestran todos los enlaces */ });
    return () => { active = false; };
  }, [finalSlug]);

  if (!finalSlug) return null;

  return (
    <nav aria-label="Información legal" className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`} style={style}>
      {docs.map((doc, i) => (
        <Fragment key={doc.key}>
          {i > 0 && <span aria-hidden="true" style={{ opacity: 0.4 }}>|</span>}
          <Link
            to={legalPath(finalSlug, doc.key)}
            target={newTab ? '_blank' : undefined}
            rel={newTab ? 'noopener noreferrer' : undefined}
            className={`underline-offset-4 hover:underline transition-opacity ${linkClassName}`}
          >
            {doc.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
