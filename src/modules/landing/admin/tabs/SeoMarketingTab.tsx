import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';
import { DEFAULT_SECTIONS } from '../../config';

interface SeoMarketingTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

type SubSection = 'general' | 'social' | 'pixel_analytics' | 'schema' | 'sitemap' | 'verification' | 'performance';

const SUB_SECTIONS: { key: SubSection; label: string; description: string }[] = [
  { key: 'general', label: 'General', description: 'Meta tags, título, descripción y Open Graph' },
  { key: 'social', label: 'Redes Sociales', description: 'Twitter, Facebook, Pinterest, LinkedIn' },
  { key: 'pixel_analytics', label: 'Pixel y Analítica', description: 'Google Analytics, GTM, Facebook Pixel, TikTok' },
  { key: 'schema', label: 'Schema.org', description: 'Datos estructurados para buscadores' },
  { key: 'sitemap', label: 'Sitemap y Robots', description: 'Configuración de indexación y sitemap' },
  { key: 'verification', label: 'Verificaciones', description: 'Google Search Console, Bing, Pinterest' },
  { key: 'performance', label: 'Rendimiento', description: 'Optimización de imágenes, cache, scripts' },
];

function Section({ label, open, onClick, children }: { label: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-all"
      >
        {label}
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function SeoMarketingTab({ sections, updateSection }: SeoMarketingTabProps) {
  const sm = {
    general: { ...DEFAULT_SECTIONS.seo_marketing.general, ...((sections.seo_marketing as any)?.general || {}) },
    social: { ...DEFAULT_SECTIONS.seo_marketing.social, ...((sections.seo_marketing as any)?.social || {}) },
    pixel_analytics: { ...DEFAULT_SECTIONS.seo_marketing.pixel_analytics, ...((sections.seo_marketing as any)?.pixel_analytics || {}) },
    schema: { ...DEFAULT_SECTIONS.seo_marketing.schema, ...((sections.seo_marketing as any)?.schema || {}) },
    sitemap: { ...DEFAULT_SECTIONS.seo_marketing.sitemap, ...((sections.seo_marketing as any)?.sitemap || {}) },
    verification: { ...DEFAULT_SECTIONS.seo_marketing.verification, ...((sections.seo_marketing as any)?.verification || {}) },
    performance: { ...DEFAULT_SECTIONS.seo_marketing.performance, ...((sections.seo_marketing as any)?.performance || {}) },
  };
  const [openSections, setOpenSections] = useState<Record<SubSection, boolean>>({
    general: true, social: false, pixel_analytics: false,
    schema: false, sitemap: false, verification: false, performance: false,
  });

  const toggle = (key: SubSection) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const update = (sub: SubSection, field: string, value: unknown) => {
    updateSection('seo_marketing', { ...sm, [sub]: { ...sm[sub], [field]: value } });
  };

  const inp = (sub: SubSection, field: string, placeholder: string, val: string) => (
    <Input value={val} onChange={e => update(sub, field, e.target.value)} className="h-11 rounded-xl text-sm" placeholder={placeholder} />
  );

  return (
    <div className="space-y-4">
      {SUB_SECTIONS.map(s => (
        <Section key={s.key} label={s.label} open={openSections[s.key]} onClick={() => toggle(s.key)}>
          {s.key === 'general' && (
            <>
              <Field label="Meta Title" hint="Título que aparece en Google (50-60 caracteres)">
                {inp('general', 'meta_title', 'Mi Negocio | Descripción corta', sm.general.meta_title)}
              </Field>
              <Field label="Meta Description" hint="Descripción en resultados de búsqueda (150-160 caracteres)">
                <textarea value={sm.general.meta_description} onChange={e => update('general', 'meta_description', e.target.value)} className="w-full h-20 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Describí tu negocio en 1-2 oraciones..." />
              </Field>
              <Field label="Keywords" hint="Palabras separadas por coma">
                {inp('general', 'keywords', 'tatuaje, diseño, arte, Buenos Aires', sm.general.keywords)}
              </Field>
              <Field label="URL Canónica" hint="URL completa de esta página (dejar vacío para auto)">
                {inp('general', 'canonical_url', 'https://tunegocio.com', sm.general.canonical_url)}
              </Field>
              <Field label="Robots">
                <select value={sm.general.robots} onChange={e => update('general', 'robots', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="index, follow">Index, Follow (default)</option>
                  <option value="noindex, follow">No Index, Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                </select>
              </Field>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Graph</p>
              <Field label="OG Title">
                {inp('general', 'og_title', 'Igual al Meta Title si está vacío', sm.general.og_title)}
              </Field>
              <Field label="OG Description">
                <textarea value={sm.general.og_description} onChange={e => update('general', 'og_description', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción para compartir en redes..." />
              </Field>
              <Field label="OG Type">
                <select value={sm.general.og_type} onChange={e => update('general', 'og_type', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="website">Website</option>
                  <option value="business.business">Business</option>
                  <option value="article">Article</option>
                </select>
              </Field>
              <Field label="OG Locale">
                {inp('general', 'og_locale', 'es_AR', sm.general.og_locale)}
              </Field>
              <Field label="OG Site Name">
                {inp('general', 'og_site_name', 'Nombre de tu negocio', sm.general.og_site_name)}
              </Field>
            </>
          )}

          {s.key === 'social' && (
            <>
              <Field label="Twitter Card" hint="Tipo de tarjeta para Twitter">
                <select value={sm.social.twitter_card} onChange={e => update('social', 'twitter_card', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="summary">Summary (cuadrada)</option>
                  <option value="summary_large_image">Summary Large Image (grande)</option>
                </select>
              </Field>
              <Field label="Twitter Site" hint="@usuario de la negocio">
                {inp('social', 'twitter_site', '@tunegocio', sm.social.twitter_site)}
              </Field>
              <Field label="Twitter Creator" hint="@usuario del dueño">
                {inp('social', 'twitter_creator', '@duenio', sm.social.twitter_creator)}
              </Field>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenido Twitter</p>
              <Field label="Twitter Title">
                {inp('social', 'twitter_title', 'Igual a OG Title si está vacío', sm.social.twitter_title)}
              </Field>
              <Field label="Twitter Description">
                <textarea value={sm.social.twitter_description} onChange={e => update('social', 'twitter_description', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción para Twitter..." />
              </Field>
              <Separator />
              <Field label="Facebook App ID">
                {inp('social', 'fb_app_id', '1234567890', sm.social.fb_app_id)}
              </Field>
              <Field label="Facebook Page URL">
                {inp('social', 'fb_page_url', 'https://facebook.com/tunegocio', sm.social.fb_page_url)}
              </Field>
              <Field label="Pinterest Description">
                <textarea value={sm.social.pinterest_description} onChange={e => update('social', 'pinterest_description', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción para Pinterest..." />
              </Field>
              <Separator />
              <Field label="LinkedIn Title">
                {inp('social', 'linkedin_title', 'Igual a OG Title si está vacío', sm.social.linkedin_title)}
              </Field>
              <Field label="LinkedIn Description">
                <textarea value={sm.social.linkedin_description} onChange={e => update('social', 'linkedin_description', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción para LinkedIn..." />
              </Field>
            </>
          )}

          {s.key === 'pixel_analytics' && (
            <>
              <Field label="Google Analytics ID" hint="Formato: G-XXXXXXXXXX">
                {inp('pixel_analytics', 'google_analytics_id', 'G-XXXXXXXXXX', sm.pixel_analytics.google_analytics_id)}
              </Field>
              <Field label="Google Tag Manager ID" hint="Formato: GTM-XXXXXXX">
                {inp('pixel_analytics', 'google_tag_manager_id', 'GTM-XXXXXXX', sm.pixel_analytics.google_tag_manager_id)}
              </Field>
              <Field label="Facebook Pixel ID" hint="Número de pixel">
                {inp('pixel_analytics', 'facebook_pixel_id', '123456789012345', sm.pixel_analytics.facebook_pixel_id)}
              </Field>
              <Field label="TikTok Pixel ID">
                {inp('pixel_analytics', 'tiktok_pixel_id', 'CXXXXXXXXXXXXXXXXX', sm.pixel_analytics.tiktok_pixel_id)}
              </Field>
              <Field label="Hotjar ID">
                {inp('pixel_analytics', 'hotjar_id', '1234567', sm.pixel_analytics.hotjar_id)}
              </Field>
              <Separator />
              <Field label="Scripts en <head>" hint="HTML/JS que se inyecta antes de </head>">
                <textarea value={sm.pixel_analytics.custom_head_scripts} onChange={e => update('pixel_analytics', 'custom_head_scripts', e.target.value)} className="w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono text-xs" placeholder='<script>/* tu script */</script>' />
              </Field>
              <Field label="Scripts en <body>" hint="HTML/JS que se inyecta al inicio de <body>">
                <textarea value={sm.pixel_analytics.custom_body_scripts} onChange={e => update('pixel_analytics', 'custom_body_scripts', e.target.value)} className="w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono text-xs" placeholder='<script>/* tu script */</script>' />
              </Field>
            </>
          )}

          {s.key === 'schema' && (
            <>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.schema.enabled} onChange={() => update('schema', 'enabled', !sm.schema.enabled)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Generar Schema.org automáticamente</span>
              </label>
              {sm.schema.enabled && (
                <>
                  <Field label="Tipo de negocio">
                    <select value={sm.schema.business_type} onChange={e => update('schema', 'business_type', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                      <option value="LocalBusiness">Local Business</option>
                      <option value="BeautySalon">Salón de Belleza</option>
                      <option value="HairSalon">Peluquería</option>
                      <option value="TattooParlor">Tattoo</option>
                      <option value="HealthClub">Gimnasio / Fitness</option>
                      <option value="Restaurant">Restaurante</option>
                      <option value="Store">Tienda</option>
                      <option value="ProfessionalService">Servicio Profesional</option>
                      <option value="MedicalBusiness">Salud</option>
                    </select>
                  </Field>
                  <Field label="Nombre del negocio">
                    {inp('schema', 'business_name', 'Mi Negocio', sm.schema.business_name)}
                  </Field>
                  <Field label="Descripción">
                    <textarea value={sm.schema.business_description} onChange={e => update('schema', 'business_description', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción breve del negocio..." />
                  </Field>
                  <Field label="URL del negocio">
                    {inp('schema', 'business_url', 'https://tunegocio.com', sm.schema.business_url)}
                  </Field>
                  <Field label="Teléfono">
                    {inp('schema', 'business_phone', '+54 11 1234-5678', sm.schema.business_phone)}
                  </Field>
                  <Field label="Email">
                    {inp('schema', 'business_email', 'info@tunegocio.com', sm.schema.business_email)}
                  </Field>
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dirección</p>
                  <Field label="Calle y número">
                    {inp('schema', 'street_address', 'Av. Corrientes 1234', sm.schema.street_address)}
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ciudad">
                      {inp('schema', 'address_locality', 'Buenos Aires', sm.schema.address_locality)}
                    </Field>
                    <Field label="Provincia">
                      {inp('schema', 'address_region', 'CABA', sm.schema.address_region)}
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Código Postal">
                      {inp('schema', 'postal_code', '1043', sm.schema.postal_code)}
                    </Field>
                    <Field label="País">
                      {inp('schema', 'address_country', 'AR', sm.schema.address_country)}
                    </Field>
                  </div>
                  <Separator />
                  <Field label="Rango de precios" hint="$ | $$ | $$$ | $$$$">
                    {inp('schema', 'price_range', '$$', sm.schema.price_range)}
                  </Field>
                  <Field label="Horarios" hint="Ej: Lu-Vi 09:00-18:00">
                    {inp('schema', 'opening_hours', 'Lu-Vi 09:00-18:00', sm.schema.opening_hours)}
                  </Field>
                  <Field label="Perfiles sociales" hint="URLs separadas por coma">
                    <textarea value={sm.schema.social_profiles} onChange={e => update('schema', 'social_profiles', e.target.value)} className="w-full h-16 rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder="https://instagram.com/tunegocio, https://facebook.com/tunegocio" />
                  </Field>
                </>
              )}
            </>
          )}

          {s.key === 'sitemap' && (
            <>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.sitemap.auto_generate} onChange={() => update('sitemap', 'auto_generate', !sm.sitemap.auto_generate)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Generar sitemap automáticamente</span>
              </label>
              <Field label="Frecuencia de cambio" hint="Avisa a los buscadores cada cuánto cambia el sitio">
                <select value={sm.sitemap.change_freq} onChange={e => update('sitemap', 'change_freq', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </Field>
              <Field label="Prioridad" hint="0.0 - 1.0 (importancia relativa)">
                {inp('sitemap', 'priority', '0.8', sm.sitemap.priority)}
              </Field>
              <Field label="Última modificación">
                {inp('sitemap', 'lastmod', '2025-01-01', sm.sitemap.lastmod)}
              </Field>
              <Separator />
              <Field label="Reglas Robots.txt personalizadas" hint="Una regla por línea">
                <textarea value={sm.sitemap.custom_robots_rules} onChange={e => update('sitemap', 'custom_robots_rules', e.target.value)} className="w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono text-xs" placeholder="Disallow: /admin&#10;Allow: /tienda" />
              </Field>
            </>
          )}

          {s.key === 'verification' && (
            <>
              <Field label="Google Search Console" hint="Contenido de la meta tag content">
                {inp('verification', 'google_search_console', 'abc123def456', sm.verification.google_search_console)}
              </Field>
              <Field label="Bing Webmaster Tools">
                {inp('verification', 'bing_webmaster', 'abc123def456', sm.verification.bing_webmaster)}
              </Field>
              <Field label="Yandex Webmaster">
                {inp('verification', 'yandex_webmaster', 'abc123def456', sm.verification.yandex_webmaster)}
              </Field>
              <Field label="Pinterest Verification">
                {inp('verification', 'pinterest_verification', 'abc123def456', sm.verification.pinterest_verification)}
              </Field>
              <Field label="Facebook Domain Verification">
                {inp('verification', 'facebook_domain_verification', 'abc123def456', sm.verification.facebook_domain_verification)}
              </Field>
            </>
          )}

          {s.key === 'performance' && (
            <>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.performance.lazy_loading_images} onChange={() => update('performance', 'lazy_loading_images', !sm.performance.lazy_loading_images)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Carga diferida de imágenes (Lazy Loading)</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.performance.preload_critical} onChange={() => update('performance', 'preload_critical', !sm.performance.preload_critical)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Pre-cargar recursos críticos</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.performance.minify_html} onChange={() => update('performance', 'minify_html', !sm.performance.minify_html)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Minificar HTML</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.performance.defer_js} onChange={() => update('performance', 'defer_js', !sm.performance.defer_js)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Diferir scripts JavaScript</span>
              </label>
              <Separator />
              <Field label="Calidad de imágenes" hint={`${sm.performance.image_quality}%`}>
                <input type="range" min={50} max={100} step={5} value={sm.performance.image_quality} onChange={e => update('performance', 'image_quality', Number(e.target.value))} className="w-full mt-1" />
              </Field>
              <Field label="Ancho máximo de imagen (px)">
                <input type="number" min={640} max={3840} step={320} value={sm.performance.max_image_width} onChange={e => update('performance', 'max_image_width', Number(e.target.value))} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm" />
              </Field>
              <Field label="Cache TTL">
                <select value={sm.performance.cache_ttl} onChange={e => update('performance', 'cache_ttl', e.target.value)} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="30m">30 minutos</option>
                  <option value="1h">1 hora</option>
                  <option value="6h">6 horas</option>
                  <option value="24h">24 horas</option>
                  <option value="7d">7 días</option>
                  <option value="30d">30 días</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all">
                <input type="checkbox" checked={sm.performance.cdn_enabled} onChange={() => update('performance', 'cdn_enabled', !sm.performance.cdn_enabled)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Habilitar CDN</span>
              </label>
            </>
          )}
        </Section>
      ))}
    </div>
  );
}
