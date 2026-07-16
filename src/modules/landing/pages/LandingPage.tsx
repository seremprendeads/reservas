import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { LandingPage as LandingPageType, LandingSections } from '../types';
import { DEFAULT_SECTIONS } from '../config';

const fallbackSections: LandingSections = DEFAULT_SECTIONS;

export function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landing, setLanding] = useState<LandingPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setLanding(data as LandingPageType);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !landing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display mb-2">Landing no encontrada</h1>
          <p className="text-muted-foreground">Esta landing page no existe o no está publicada.</p>
        </div>
      </div>
    );
  }

  const s = (landing.sections as LandingSections) || fallbackSections;
  const theme = (landing.theme as Record<string, string>) || {};
  const seo = (landing.seo as Record<string, string>) || {};

  const primaryColor = theme.primary_color || '#059669';
  const bgColor = theme.bg_color || '#ffffff';
  const textColor = theme.text_color || '#111827';
  const mutedColor = theme.muted_color || '#6b7280';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* SEO */}
      <title>{seo.title || s.hero.title || landing.slug}</title>
      {seo.description && <meta name="description" content={seo.description} />}

      {/* Hero */}
      <section className="relative py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            {s.hero.title || 'Tu negocio de confianza'}
          </h1>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto" style={{ color: mutedColor }}>
            {s.hero.subtitle || 'Descripción de tu negocio'}
          </p>
          {s.hero.cta_text && (
            <a
              href="#contacto"
              className="inline-flex items-center px-8 py-4 rounded-xl text-white font-bold text-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              {s.hero.cta_text}
            </a>
          )}
        </div>
      </section>

      {/* About */}
      {s.about.description && (
        <section className="py-16 px-4 border-t" style={{ borderColor: `${textColor}10` }}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold font-display mb-4">{s.about.title || 'Sobre nosotros'}</h2>
              <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                {s.about.description}
              </p>
            </div>
            {s.about.image_url && (
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={s.about.image_url} alt={s.about.title} className="w-full h-64 object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services */}
      {s.services.items.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: `${textColor}05` }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-10">{s.services.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {s.services.items.map((service, i) => (
                <div key={i} className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: bgColor }}>
                  <h3 className="font-bold text-lg font-display mb-2">{service.name}</h3>
                  <p className="text-sm mb-4" style={{ color: mutedColor }}>{service.description}</p>
                  {service.price && (
                    <p className="text-xl font-bold" style={{ color: primaryColor }}>{service.price}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {s.testimonials.items.length > 0 && (
        <section className="py-16 px-4 border-t" style={{ borderColor: `${textColor}10` }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-10">{s.testimonials.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {s.testimonials.items.map((t, i) => (
                <div key={i} className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: bgColor }}>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className={`text-lg ${j < t.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-sm italic mb-3" style={{ color: mutedColor }}>"{t.text}"</p>
                  <p className="text-sm font-semibold">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {s.faq.items.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: `${textColor}05` }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center mb-10">{s.faq.title}</h2>
            <div className="space-y-4">
              {s.faq.items.map((faq, i) => (
                <details key={i} className="group rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: bgColor }}>
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold font-display">
                    {faq.question}
                    <span className="ml-2 transition-transform group-open:rotate-45 text-xl">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm" style={{ color: mutedColor }}>
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold font-display mb-4">{s.cta.title}</h2>
          <p className="text-lg opacity-90 mb-8">{s.cta.description}</p>
          <a
            href="#contacto"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-white font-bold text-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            style={{ color: primaryColor }}
          >
            {s.cta.button_text || 'Reservar ahora'}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: `${textColor}10` }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: mutedColor }}>
          <p>© {new Date().getFullYear()} {landing.slug}</p>
          <p className="text-xs opacity-60">Powered by Reserva Unica</p>
        </div>
      </footer>
    </div>
  );
}
