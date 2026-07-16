import { callGemini } from '../gemini.ts';
import {
  type AIProvider,
  type GenerateLandingParams,
  type RegenerateSectionParams,
  type ImproveTextParams,
  type GenerateFAQParams,
  type GenerateSEOParams,
  parseAIJSON,
  LANDING_SYSTEM_PROMPT,
  SECTION_PROMPTS,
} from '../ai-provider.ts';

export class GeminiAIProvider implements AIProvider {
  private model: string;

  constructor() {
    this.model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  }

  async generateLanding(params: GenerateLandingParams) {
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
    const sections = parseAIJSON(text);
    return { sections, tokensUsed };
  }

  async regenerateSection(params: RegenerateSectionParams) {
    const prompt = `Negocio: ${params.businessContext || ''}
Sección a regenerar: ${params.sectionKey}
Contenido actual: ${JSON.stringify(params.currentSections, null, 2)}
${params.instructions ? `Instrucciones: ${params.instructions}` : ''}`;

    const systemPrompt = `${LANDING_SYSTEM_PROMPT}\n\n${SECTION_PROMPTS[params.sectionKey] || 'Regenerá esta sección con contenido profesional.'}`;

    const { text, tokensUsed } = await callGemini(prompt, systemPrompt);
    const section = parseAIJSON(text);
    return { section, tokensUsed };
  }

  async improveText(params: ImproveTextParams) {
    const prompt = `Mejorá este texto para una landing page profesional:
"${params.text}"
${params.context ? `Contexto: ${params.context}` : ''}

Respondé SOLO con el texto mejorado, sin comillas, sin explicaciones.`;

    const { text: improved, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    return { text: improved.trim(), tokensUsed };
  }

  async generateFAQ(params: GenerateFAQParams) {
    const prompt = `Generá 4-5 preguntas frecuentes para: ${params.businessContext}
Cada FAQ debe ser algo que un cliente se haría antes de reservar.

JSON: { "items": [{ "question": "...", "answer": "..." }] }`;

    const { text, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    const data = parseAIJSON(text) as { items?: { question: string; answer: string }[] };
    return { items: data.items || [], tokensUsed };
  }

  async generateSEO(params: GenerateSEOParams) {
    const prompt = `Generá SEO para esta landing:
Negocio: ${params.businessName}
Descripción: ${params.description}

JSON: { "title": "Título SEO (máx 60 chars)", "description": "Meta descripción (máx 160 chars)", "keywords": ["keyword1", "keyword2", ...] }`;

    const { text, tokensUsed } = await callGemini(prompt, LANDING_SYSTEM_PROMPT);
    const data = parseAIJSON(text) as { title?: string; description?: string; keywords?: string[] };
    return {
      title: data.title || params.businessName,
      description: data.description || params.description,
      keywords: data.keywords || [],
      tokensUsed,
    };
  }
}
