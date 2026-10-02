// Edge Function de Vercel: reescribe el HTML de las landings publicas para
// inyectar el <head> SEO (title, description, canonical, Open Graph, Twitter,
// JSON-LD) y un bloque <noscript> con el contenido real del negocio.
//
// Por que: la app es una SPA. El SEO de cada negocio se armaba SOLO despues de
// que el bot ejecutara JavaScript (src/modules/landing/pages/LandingPage.tsx),
// asi que los rastreadores que no renderizan JS (GPTBot, ClaudeBot,
// PerplexityBot, CCBot...) no veian nada y las landings tampoco se indexaban
// bien. Ademas cada visita de bot terminaba golpeando Supabase.
//
// Que NO hace: no reemplaza la SPA. El HTML que se devuelve es el mismo
// index.html con tags extra en <head>; React sigue montando la pagina entera e
// ignora lo inyectado (sigue usando sus propios datos frescos). Si algo falla
// (Supabase caido, slug inexistente, error de runtime) devuelve el index.html
// original sin tocar: la web nunca queda caida por esto.
//
// Cache: la respuesta se cachea en el CDN de Vercel con s-maxage, asi que un
// crawler que reintenta golpea la CDN y no vuelve a consultar Supabase.

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const CACHE_OK = 'public, s-maxage=300, stale-while-revalidate=86400';
const CACHE_MISS = 'public, s-maxage=30, stale-while-revalidate=300';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// Todo lo que llega de Supabase/JSON es dinamico. asObj/asArr evitan el `any`
// manteniendo el tipo seguro para el linter.
function asObj(value: Json | undefined): Record<string, Json> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function asArr(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

// Primer valor no vacio. Todo el SEO pasa por aca para no repetir los mismos
// if/else en cada tag.
function pick(...values: Json[]) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

// Los textos del negocio pueden traer HTML de un editor rico. Para los meta
// y el <noscript> solo queremos texto plano.
function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Para JSON dentro de <script>: escapar "<" evita que un "</script>" dentro de
// un texto del negocio cierre el tag antes de tiempo.
function escJson(value: string): string {
  return value.replace(/</g, '\\u003c');
}

async function restGet(path: string): Promise<Json[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`supabase rest ${res.status}`);
  const data: Json = await res.json();
  return asArr(data);
}

// Tipos de schema.org validos para un negocio. Si el dueno escribio una
// etiqueta en vez de un tipo ("Negocio local"), lo ignoramos y usamos
// LocalBusiness en vez de emitir un @type invalido.
function schemaType(value: string): string {
  const allowed = [
    'LocalBusiness', 'Restaurant', 'Store', 'BeautySalon', 'HairSalon',
    'HealthAndBeautyBusiness', 'MedicalBusiness', 'Dentist', 'Physician',
    'Gym', 'ExerciseGym', 'SportsActivityLocation', 'Hotel', 'CafeOrCoffeeShop',
    'BarOrPub', 'NightClub', 'ProfessionalService', 'HomeAndConstructionBusiness',
    'AutomotiveBusiness', 'LegalService', 'FinancialService', 'RealEstateAgent',
    'TravelAgency', 'EventVenue', 'FoodEstablishment', 'Bakery',
  ];
  return allowed.includes(value) ? value : 'LocalBusiness';
}

function buildJsonLd(opts: {
  canonical: string;
  schemaCfg: Record<string, Json>;
  title: string;
  description: string;
  image: string;
  footer: Record<string, Json>;
}): string {
  const { canonical, schemaCfg, title, description, image, footer } = opts;

  const addressParts: Record<string, string> = {};
  for (const [key, value] of Object.entries({
    streetAddress: pick(schemaCfg.street_address),
    addressLocality: pick(schemaCfg.address_locality),
    addressRegion: pick(schemaCfg.address_region),
    postalCode: pick(schemaCfg.postal_code),
    addressCountry: pick(schemaCfg.address_country),
  })) {
    if (value) addressParts[key] = value;
  }
  const hasAddress = Object.keys(addressParts).length > 0;

  const sameAs = pick(schemaCfg.social_profiles, footer.instagram, footer.facebook)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));

  const data: Record<string, Json> = {
    '@context': 'https://schema.org',
    '@type': schemaType(pick(schemaCfg.business_type)),
    name: pick(schemaCfg.business_name, title),
    description: pick(schemaCfg.business_description, description),
    url: pick(schemaCfg.business_url) || canonical,
  };

  const imageUrl = pick(schemaCfg.business_logo, image);
  if (imageUrl) data.image = imageUrl;
  const phone = pick(schemaCfg.business_phone, footer.phone, footer.whatsapp);
  if (phone) data.telephone = phone;
  const email = pick(schemaCfg.business_email, footer.email);
  if (email) data.email = email;
  if (pick(schemaCfg.price_range)) data.priceRange = pick(schemaCfg.price_range);
  if (pick(schemaCfg.opening_hours)) data.openingHours = pick(schemaCfg.opening_hours);
  if (hasAddress) data.address = { '@type': 'PostalAddress', ...addressParts };
  if (sameAs.length) data.sameAs = sameAs;

  return escJson(JSON.stringify(data));
}

function buildNoscript(opts: {
  slug: string;
  title: string;
  description: string;
  mainService: Record<string, Json>;
  secondary: Record<string, Json>;
  footer: Record<string, Json>;
}): string {
  const { slug, title, description, mainService, secondary, footer } = opts;

  const services = asArr(secondary.items)
    .map((raw) => {
      const item = asObj(raw);
      const name = stripTags(pick(item.title));
      const text = stripTags(pick(item.description));
      if (!name && !text) return '';
      return `<li><strong>${esc(name)}</strong>${text ? ` — ${esc(text)}` : ''}</li>`;
    })
    .filter(Boolean)
    .slice(0, 20);

  const mainName = stripTags(pick(mainService.title));
  const mainText = stripTags(pick(mainService.description));

  const contact = [
    pick(footer.phone) && `<li>Telefono: ${esc(stripTags(pick(footer.phone)))}</li>`,
    pick(footer.whatsapp) && `<li>WhatsApp: ${esc(stripTags(pick(footer.whatsapp)))}</li>`,
    pick(footer.email) && `<li>Email: ${esc(stripTags(pick(footer.email)))}</li>`,
    pick(footer.address) && `<li>Direccion: ${esc(stripTags(pick(footer.address)))}</li>`,
  ].filter(Boolean);

  const links = [
    `<a href="/${esc(slug)}/reservas">Reservar un turno</a>`,
    `<a href="/${esc(slug)}/tienda">Tienda</a>`,
    `<a href="/${esc(slug)}/bio">Bio / links</a>`,
  ].join(' &middot; ');

  return [
    '<noscript>',
    '<div style="max-width:720px;margin:0 auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a">',
    `<h1>${esc(title)}</h1>`,
    description ? `<p>${esc(description)}</p>` : '',
    mainName || mainText
      ? `<h2>${esc(mainName || 'Servicio principal')}</h2>${mainText ? `<p>${esc(mainText)}</p>` : ''}`
      : '',
    services.length ? `<h2>Servicios</h2><ul>${services.join('')}</ul>` : '',
    contact.length ? `<h2>Contacto</h2><ul>${contact.join('')}</ul>` : '',
    `<p>${links}</p>`,
    '</div>',
    '</noscript>',
  ].join('');
}

// Tags que el index.html base trae para la plataforma. Hay que sacarlos antes
// de inyectar los del negocio: los crawlers toman la PRIMERA ocurrencia, asi
// que si dejara los originales ganaria el titulo generico de la plataforma.
function stripBaseTags(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '');
}

async function fetchIndexHtml(req: Request): Promise<string> {
  // /index.html es un archivo estatico de la build: Vercel lo sirve desde el
  // filesystem antes de aplicar rewrites, asi que esto no vuelve a entrar aqui.
  const res = await fetch(new URL('/index.html', req.url), {
    headers: { accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`index.html ${res.status}`);
  return res.text();
}

async function passthrough(req: Request, cacheControl: string): Promise<Response> {
  const html = await fetchIndexHtml(req);
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': cacheControl,
      vary: 'Accept-Encoding',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = (url.searchParams.get('slug') || '').trim();
  const path = (url.searchParams.get('path') || (slug ? `/${slug}` : '/')).trim();

  if (!SUPABASE_URL || !ANON_KEY || !slug) {
    try {
      return await passthrough(req, CACHE_MISS);
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }

  let landing: Json | null = null;
  let business: Json | null = null;

  try {
    const [landingRows, businessRows] = await Promise.all([
      restGet(
        `landing_pages?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=slug,seo,sections,logo_url`
      ),
      restGet(`public_businesses?slug=eq.${encodeURIComponent(slug)}&select=name,logo_url`),
    ]);
    landing = landingRows[0] ?? null;
    business = businessRows[0] ?? null;
  } catch {
    // Supabase caido o slug raro: mejor el HTML plano (la SPA igual lo carga
    // desde el navegador) que un error.
    try {
      return await passthrough(req, CACHE_MISS);
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }

  if (!landing) {
    try {
      return await passthrough(req, CACHE_MISS);
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }

  try {
    const origin = url.origin;
    const root = asObj(landing);
    const sections = asObj(root.sections);
    const seo = asObj(root.seo);
    const seoMarketing = asObj(sections.seo_marketing);
    const general = asObj(seoMarketing.general);
    const social = asObj(seoMarketing.social);
    const verification = asObj(seoMarketing.verification);
    const schemaCfg = asObj(seoMarketing.schema);
    const hero = asObj(sections.hero);
    const about = asObj(sections.about);
    const footer = asObj(sections.footer);
    const mainService = asObj(sections.main_service);
    const secondary = asObj(sections.secondary_services);
    const businessObj = asObj(business ?? undefined);

    const title = pick(
      general.meta_title, seo.title, hero.title, businessObj.name, 'Reservas online'
    );
    const description = pick(
      general.meta_description,
      seo.description,
      about.description,
      hero.description,
      hero.subtitle
    );
    const keywords = stripTags(pick(general.keywords));
    const robots = stripTags(pick(general.robots)) || 'index, follow';
    const ogTitle = pick(general.og_title, general.meta_title, seo.title, hero.title, title);
    const ogDescription = pick(general.og_description, general.meta_description, description);
    const ogImage = pick(
      general.og_image, seo.og_image, hero.image_url, hero.logo_url,
      root.logo_url, businessObj.logo_url
    );
    const canonical = pick(general.canonical_url) || `${origin}${path === '/' ? '' : path}`;

    const head: string[] = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(description || title)}" />`,
      keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : '',
      `<meta name="robots" content="${esc(robots)}" />`,
      `<link rel="canonical" href="${esc(canonical)}" />`,
      `<meta property="og:type" content="${esc(pick(general.og_type) || 'website')}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      `<meta property="og:title" content="${esc(ogTitle)}" />`,
      ogDescription
        ? `<meta property="og:description" content="${esc(ogDescription)}" />`
        : '',
      ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : '',
      `<meta property="og:locale" content="${esc(pick(general.og_locale) || 'es_AR')}" />`,
      `<meta property="og:site_name" content="${esc(pick(general.og_site_name, businessObj.name, title))}" />`,
      `<meta name="twitter:card" content="${esc(pick(social.twitter_card) || 'summary_large_image')}" />`,
      `<meta name="twitter:title" content="${esc(pick(social.twitter_title, ogTitle))}" />`,
      social.twitter_description || ogDescription
        ? `<meta name="twitter:description" content="${esc(pick(social.twitter_description, ogDescription))}" />`
        : '',
      pick(social.twitter_image, ogImage)
        ? `<meta name="twitter:image" content="${esc(pick(social.twitter_image, ogImage))}" />`
        : '',
      pick(social.twitter_site)
        ? `<meta name="twitter:site" content="${esc(social.twitter_site)}" />`
        : '',
      pick(social.fb_app_id)
        ? `<meta property="fb:app_id" content="${esc(social.fb_app_id)}" />`
        : '',
      pick(verification.google_search_console)
        ? `<meta name="google-site-verification" content="${esc(verification.google_search_console)}" />`
        : '',
      pick(verification.bing_webmaster)
        ? `<meta name="msvalidate.01" content="${esc(verification.bing_webmaster)}" />`
        : '',
      `<script type="application/ld+json">${buildJsonLd({
        canonical, schemaCfg, title, description, image: ogImage, footer,
      })}</script>`,
    ]
      .filter(Boolean)
      .join('\n    ');

    const noscript = buildNoscript({ slug, title, description, mainService, secondary, footer });

    let html = await fetchIndexHtml(req);
    html = stripBaseTags(html);
    html = html.includes('</head>')
      ? html.replace('</head>', `    ${head}\n  </head>`)
      : `    ${head}\n${html}`;
    html = html.includes('<div id="root"></div>')
      ? html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscript}`)
      : html;

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': CACHE_OK,
        vary: 'Accept-Encoding',
      },
    });
  } catch {
    try {
      return await passthrough(req, CACHE_MISS);
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }
}