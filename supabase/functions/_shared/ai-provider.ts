// AI Provider Interface + Factory
// Provider is selected via AI_PROVIDER env var (default: "gemini")
// To add a new provider: implement AIProvider and register it in createAIProvider()

export interface GenerateLandingParams {
  businessName: string;
  businessType?: string;
  services?: { name: string; price?: number }[];
  city?: string;
}

export interface RegenerateSectionParams {
  sectionKey: string;
  currentSections: Record<string, unknown>;
  instructions?: string;
  businessContext?: string;
}

export interface ImproveTextParams {
  text: string;
  context?: string;
}

export interface GenerateFAQParams {
  businessContext: string;
}

export interface GenerateSEOParams {
  businessName: string;
  description: string;
}

export interface AIProvider {
  generateLanding(params: GenerateLandingParams): Promise<{ sections: Record<string, unknown>; tokensUsed: number }>;
  regenerateSection(params: RegenerateSectionParams): Promise<{ section: Record<string, unknown>; tokensUsed: number }>;
  improveText(params: ImproveTextParams): Promise<{ text: string; tokensUsed: number }>;
  generateFAQ(params: GenerateFAQParams): Promise<{ items: { question: string; answer: string }[]; tokensUsed: number }>;
  generateSEO(params: GenerateSEOParams): Promise<{ title: string; description: string; keywords: string[]; tokensUsed: number }>;
}

// Shared utility — all providers can use this
export function parseAIJSON(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// Default prompts — providers can override or use as needed
export const LANDING_SYSTEM_PROMPT = `Sos un experto en marketing digital y copywriting para negocios de servicios en Argentina.
Respondé ÚNICAMENTE con JSON válido, sin markdown, sin backticks.
Español rioplatense. Contenido breve y persuasivo. Orientado a conversión.`;

export const SECTION_PROMPTS: Record<string, string> = {
  hero: `Regenerá el hero. Título impactante (máx 60 chars), subtítulo persuasivo (máx 120 chars), CTA urgente (máx 25 chars).
JSON: { "title": "...", "subtitle": "...", "cta_text": "...", "image_url": null }`,

  about: `Regenerá "Sobre nosotros". Descripción profesional pero cercana, 2-3 oraciones.
JSON: { "title": "Sobre nosotros", "description": "...", "image_url": null }`,

  services: `Regenerá servicios. 3-4 servicios con nombre, descripción breve y precio en formato argentino.
JSON: { "title": "Nuestros servicios", "items": [{ "name": "...", "description": "...", "price": "$XXX" }] }`,

  testimonials: `Generá 3 testimonios realistas. Nombre, texto positivo (1-2 oraciones), rating 4-5.
JSON: { "title": "Lo que dicen nuestros clientes", "items": [{ "name": "...", "text": "...", "rating": 5 }] }`,

  faq: `Generá 4-5 preguntas frecuentes relevantes para este tipo de negocio.
JSON: { "title": "Preguntas frecuentes", "items": [{ "question": "...", "answer": "..." }] }`,

  cta: `Regenerá el call to action final. Título motivador, descripción breve, botón con acción clara.
JSON: { "title": "...", "description": "...", "button_text": "..." }`,
};

// ──────────────────────────────────────────────
// Provider Registry
// Add new providers here:
//   import { OpenAIProvider } from './providers/openai.ts';
//   case 'openai': return new OpenAIProvider();
// ──────────────────────────────────────────────

import { GeminiAIProvider } from './providers/gemini.ts';

export function createAIProvider(): AIProvider {
  const provider = Deno.env.get('AI_PROVIDER') || 'gemini';

  switch (provider) {
    case 'gemini':
      return new GeminiAIProvider();
    // case 'openai':
    //   return new OpenAIProvider();
    // case 'anthropic':
    //   return new AnthropicAIProvider();
    default:
      console.warn(`Unknown AI provider "${provider}", falling back to gemini`);
      return new GeminiAIProvider();
  }
}
