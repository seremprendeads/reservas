# PLAN: Módulo IA para Landing Page - BookingBio

## Decisiones del Usuario
- **Proveedor IA:** Gemini (Google)
- **Tipo de Landing:** Página independiente (`/landing/:slug`)
- **Storage:** Nueva tabla `landing_pages`
- **Créditos Beta:** 15

---

## FASE 1: Base de Datos

### Nuevas tablas

#### `landing_pages`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE
slug            TEXT (unique per business)
sections        JSONB (contenido de cada sección)
theme           JSONB (colores, fuentes, espaciado)
status          TEXT DEFAULT 'draft' (draft/published)
seo             JSONB (title, description, og_image)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**Estructura `sections` (JSONB):**
```json
{
  "hero": {
    "title": "string",
    "subtitle": "string",
    "cta_text": "string",
    "image_url": "string|null"
  },
  "about": {
    "title": "string",
    "description": "string",
    "image_url": "string|null"
  },
  "services": {
    "title": "string",
    "items": [{"name", "description", "price"}]
  },
  "testimonials": {
    "title": "string",
    "items": [{"name", "text", "rating"}]
  },
  "faq": {
    "title": "string",
    "items": [{"question", "answer"}]
  },
  "cta": {
    "title": "string",
    "description": "string",
    "button_text": "string"
  },
  "footer": {
    "text": "string",
    "social_links": {}
  }
}
```

#### `ai_credits`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
business_id     UUID UNIQUE REFERENCES businesses(id)
credits_total   INT DEFAULT 15
credits_used    INT DEFAULT 0
credits_remaining INT GENERATED ALWAYS AS (credits_total - credits_used) STORED
last_reset_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `ai_usage_history`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
business_id     UUID REFERENCES businesses(id)
action          TEXT (landing_generation, hero_rewrite, faq_generation, etc.)
credits_cost    INT
metadata        JSONB (qué se generó, tokens usados, etc.)
created_at      TIMESTAMPTZ DEFAULT now()
```

### Índices
```sql
CREATE INDEX idx_landing_pages_business ON landing_pages(business_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_ai_credits_business ON ai_credits(business_id);
CREATE INDEX idx_ai_usage_business ON ai_usage_history(business_id);
CREATE INDEX idx_ai_usage_created ON ai_usage_history(created_at DESC);
```

### RLS Policies
```sql
-- landing_pages: solo el owner del business puede ver/editar
-- ai_credits: solo el owner puede ver
-- ai_usage_history: solo el owner puede ver
-- Public landing page: anyone can read published landings
```

---

## FASE 2: Configuración de Créditos

### `src/modules/landing/config.ts`
```typescript
export const AI_CREDIT_COSTS = {
  LANDING_GENERATION: 5,
  HERO_REWRITE: 1,
  ABOUT_REWRITE: 1,
  SERVICES_REWRITE: 1,
  TESTIMONIALS_GENERATE: 1,
  FAQ_GENERATION: 1,
  SEO_GENERATION: 1,
  TEXT_REWRITE: 1,
  SECTION_REGENERATE: 1,
} as const;

export const PLAN_CREDITS = {
  free: 0,
  starter: 10,
  pro: 15,
  enterprise: 50,
} as const;

export const LOW_CREDITS_THRESHOLD = 3;
```

---

## FASE 3: Edge Functions

### `supabase/functions/ai-generate-landing/`
- Recibe: `business_id`, `business_data` (nombre, servicios, descripción)
- Usa Gemini API para generar contenido completo de landing
- Consume créditos (5)
- Guarda en `landing_pages`
- Registra en `ai_usage_history`
- Retorna la landing generada

### `supabase/functions/ai-regenerate-section/`
- Recibe: `landing_page_id`, `section_key`, `instructions`
- Regenera solo una sección con Gemini
- Consume créditos (1)
- Actualiza `landing_pages.sections`
- Registra en `ai_usage_history`

### `supabase/functions/ai-credits/`
- GET: Retorna créditos del business
- POST: Consume créditos (valida que haya suficientes)
- Maneja el caso de 0 créditos

### `supabase/functions/ai-usage-history/`
- GET: Retorna historial de uso del business
- Paginado (últimos 50 registros)

---

## FASE 4: Frontend - Admin Panel

### Nueva vista: `landing` en AdminPage

#### Sub-secciones:
1. **Preview/Editor** - Vista previa de la landing con edición inline
2. **Secciones** - Lista de secciones editables con drag-to-reorder
3. **SEO** - Título, descripción, imagen OG
4. **Configuración** - Colores, fuente, espaciado

#### Componentes nuevos:

### `src/modules/landing/admin/LandingAdmin.tsx`
- Componente principal del admin de landing
- Muestra preview + editor lado a lado (desktop) o stacked (mobile)
- Botón "Generar con IA" si no hay landing
- Botones de regenerar por sección

### `src/modules/landing/admin/LandingPreview.tsx`
- Preview en vivo de la landing
- Renderiza cada sección con datos reales
- Click en sección → abre editor de esa sección

### `src/modules/landing/admin/LandingSectionEditor.tsx`
- Editor de una sección específica
- Inputs para cada campo
- Botón "Regenerar con IA" por campo

### `src/modules/landing/admin/AiCreditsIndicator.tsx`
- Muestra: 🤖 Créditos IA: 12/15 disponibles
- Barra de progreso moderna
- Texto "Disponibles" / "Usados"

### `src/modules/landing/admin/AiLowCreditsWarning.tsx`
- Warning amarillo cuando quedan ≤3 créditos
- Botón "Ver Planes"

### `src/modules/landing/admin/AiNoCreditsModal.tsx`
- Modal elegante cuando créditos = 0
- Lista de lo que SÍ puede hacer manualmente
- Botones: Comprar Créditos / Actualizar Plan / Seguir editando

### `src/modules/landing/admin/AiUsageHistory.tsx`
- Lista de acciones IA realizadas
- Icono + descripción + fecha + créditos consumidos
- Ejemplo: "✔ Landing generada - 5 créditos - 15/07/2026"

---

## FASE 5: Frontend - Página Pública

### Nueva ruta: `/landing/:slug`

### `src/modules/landing/pages/LandingPage.tsx`
- Página pública que renderiza la landing desde la DB
- Sections rendering: Hero, About, Services, Testimonials, FAQ, CTA, Footer
- Responsive design
- SEO meta tags (via react-helmet o DOM manipulation)
- Estilo premium: Gradient, espaciado, tipografía Geist/Inter

### `src/modules/landing/components/`
- `LandingHero.tsx` - Hero con título, subtítulo, CTA, imagen
- `LandingAbout.tsx` - Sección About
- `LandingServices.tsx` - Grid de servicios
- `LandingTestimonials.tsx` - Testimonios con estrellas
- `LandingFaq.tsx` - Acordeón de preguntas
- `LandingCta.tsx` - Call to action final
- `LandingFooter.tsx` - Footer con links sociales

---

## FASE 6: Integración con Gemini

### `supabase/functions/_shared/gemini.ts`
- Helper para llamar a la API de Gemini
- Rate limiting
- Error handling
- Logging de tokens usados

### Prompt template para generación de landing:
```
Sos un experto en marketing digital y copywriting para negocios de servicios en Argentina.

Generá el contenido para una Landing Page para:
- Negocio: {business_name}
- Rubro: {business_type}
- Servicios: {services_list}
- Ciudad: {city}
- Tono: Profesional pero cercano

Generá JSON con las siguientes secciones:
- hero: {title, subtitle, cta_text}
- about: {title, description}
- services: {title, items: [{name, description, price}]}
- testimonials: {title, items: [{name, text, rating}]}
- faq: {title, items: [{question, answer}]}
- cta: {title, description, button_text}

El contenido debe ser:
- En español rioplatense (Argentina)
- Breve y persuasivo
- SEO-friendly
- Orientado a conversión (reservar turnos)
```

---

## FASE 7: Integración en AdminPage

### Agregar vista `landing` al type View:
```typescript
type View = 'dashboard' | 'bookings' | ... | 'landing';
```

### Agregar al sidebar:
```typescript
{ id: 'landing', label: 'Landing IA', icon: Sparkles }
```

### Agregar indicator en dashboard:
- Mini card de créditos IA en el dashboard
- Muestra créditos restantes con barra

---

## ARCHIVOS A CREAR

### Base de datos:
- `supabase/migrations/YYYY landing_pages_ai_credits.sql`

### Config:
- `src/modules/landing/config.ts`

### Tipos:
- `src/modules/landing/types.ts`

### Edge Functions:
- `supabase/functions/ai-generate-landing/index.ts`
- `supabase/functions/ai-regenerate-section/index.ts`
- `supabase/functions/ai-credits/index.ts`
- `supabase/functions/ai-usage-history/index.ts`
- `supabase/functions/_shared/gemini.ts`

### Admin Components:
- `src/modules/landing/admin/LandingAdmin.tsx`
- `src/modules/landing/admin/LandingPreview.tsx`
- `src/modules/landing/admin/LandingSectionEditor.tsx`
- `src/modules/landing/admin/AiCreditsIndicator.tsx`
- `src/modules/landing/admin/AiLowCreditsWarning.tsx`
- `src/modules/landing/admin/AiNoCreditsModal.tsx`
- `src/modules/landing/admin/AiUsageHistory.tsx`

### Public Page:
- `src/modules/landing/pages/LandingPage.tsx`

### Landing Components:
- `src/modules/landing/components/LandingHero.tsx`
- `src/modules/landing/components/LandingAbout.tsx`
- `src/modules/landing/components/LandingServices.tsx`
- `src/modules/landing/components/LandingTestimonials.tsx`
- `src/modules/landing/components/LandingFaq.tsx`
- `src/modules/landing/components/LandingCta.tsx`
- `src/modules/landing/components/LandingFooter.tsx`

### Router:
- Actualizar `src/App.tsx` con ruta `/landing/:slug`

### Admin Page:
- Actualizar `src/pages/AdminPage.tsx` con vista `landing` + créditos indicator

---

## ARCHIVOS A MODIFICAR

- `src/App.tsx` — agregar ruta `/landing/:slug`
- `src/pages/AdminPage.tsx` — agregar vista `landing`, sidebar item, créditos indicator
- `src/lib/supabase.ts` — agregar tipos para landing_pages, ai_credits, ai_usage_history

---

## ORDEN DE IMPLEMENTACIÓN

1. **DB Migration** — Crear tablas + RLS + índices
2. **Config + Types** — Archivos de configuración y tipos TypeScript
3. **Edge Functions** — Gemini helper, credits, generate, regenerate, history
4. **Admin Components** — Credits indicator, landing editor, usage history
5. **Public Page** — Landing page renderer + components
6. **Router + AdminPage** — Integración en la app
7. **Build + Test** — Verificar que compila y funciona

---

## ESTIMACIÓN DE COSTOS GEMINI

- Generación completa landing: ~2000 tokens → ~$0.001
- Regenerar sección: ~500 tokens → ~$0.0003
- 15 créditos × ~$0.001 promedio = ~$0.015 por usuario Beta
- Muy bajo costo operativo
