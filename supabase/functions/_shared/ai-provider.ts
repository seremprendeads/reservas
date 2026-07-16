import { callGemini } from './gemini.ts';

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

export interface AIProvider {
  generateLanding(params: GenerateLandingParams): Promise<{ sections: Record<string, unknown>; tokensUsed: number }>;
  regenerateSection(params: RegenerateSectionParams): Promise<{ section: Record<string, unknown>; tokensUsed: number }>;
  improveText(text: string, context?: string): Promise<{ text: string; tokensUsed: number }>;
  generateFAQ(businessContext: string): Promise<{ items: { question: string; answer: string }[]; tokensUsed: number }>;
  generateSEO(businessName: string, description: string): Promise<{ title: string; description: string; keywords: string[]; tokensUsed: number }>;
}

const LANDING_SYSTEM_PROMPT = `Sos un experto en marketing digital y copywriting para negocios de servicios en Argentina.
Respondé ÚNICAMENTE con JSON válido, sin markdown, sin backticks.
Español rioplatense. Contenido breve y persuasivo. Orientado a conversión.`;

const SECTION_PROMPTS: Record<string, string> = {
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

function parseJSON(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export class GeminiAIProvider implements AIProvider {
  async generateLanding(params: GenerateLandingParams): Promise<{ sections: Record<string, unknown>; tokensUsed: number }> {
    const servicesList = params.services?.map((s) =>
      `- ${s.name}${s.price ? ` ($${s.price})` : ''}`
    ).join('\n') || 'No especificados';

    const prompt = `Negocio: ${params.businessName}
Rubro: ${params.businessType || 'Servicios'}
Ciudad: ${params.city || 'Argentina'}
Servicios conocidos:
${servicesList}

Generá el contenido completo de la landing page.`;

    const { text, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    const sections = parseJSON(text);
    return { sections, tokensUsed };
  }

  async regenerateSection(params: RegenerateSectionParams): Promise<{ section: Record<string, unknown>; tokensUsed: number }> {
    const prompt = `Negocio: ${params.businessContext || ''}
Sección a regenerar: ${params.sectionKey}
Contenido actual: ${JSON.stringify(params.currentSections, null, 2)}
${params.instructions ? `Instrucciones: ${params.instructions}` : ''}`;

    const systemPrompt = `${LANDING_SYSTEM_PROMPT}\n\n${SECTION_PROMPTS[params.sectionKey] || 'Regenerá esta sección con contenido profesional.'}`;

    const { text, tokensUsed } = await callGemini(prompt, systemPrompt);
    const section = parseJSON(text);
    return { section, tokensUsed };
  }

  async improveText(text: string, context?: string): Promise<{ text: string; tokensUsed: number }> {
    const prompt = `Mejorá este texto para una landing page profesional:
"${text}"
${context ? `Contexto: ${context}` : ''}

Respondé SOLO con el texto mejorado, sin comillas, sin explicaciones.`;

    const { text: improved, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    return { text: improved.trim(), tokensUsed };
  }

  async generateFAQ(businessContext: string): Promise<{ items: { question: string; answer: string }[]; tokensUsed: number }> {
    const prompt = `Generá 4-5 preguntas frecuentes para: ${businessContext}
Cada FAQ debe ser algo que un cliente se haría antes de reservar.

JSON: { "items": [{ "question": "...", "answer": "..." }] }`;

    const { text, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    const data = parseJSON(text) as { items?: { question: string; answer: string }[] };
    return { items: data.items || [], tokensUsed };
  }

  async generateSEO(businessName: string, description: string): Promise<{ title: string; description: string; keywords: string[]; tokensUsed: number }> {
    const prompt = `Generá SEO para esta landing:
Negocio: ${businessName}
Descripción: ${description}

JSON: { "title": "Título SEO (máx 60 chars)", "description": "Meta descripción (máx 160 chars)", "keywords": ["keyword1", "keyword2", ...] }`;

    const { text, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    const data = parseJSON(text) as { title?: string; description?: string; keywords?: string[] };
    return {
      title: data.title || businessName,
      description: data.description || description,
      keywords: data.keywords || [],
      tokensUsed,
    };
  }
}

export function createAIProvider(): AIProvider {
  return new GeminiAIProvider();
}
