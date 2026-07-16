import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateToken, corsHeaders } from '../_shared/auth.ts';
import { callGemini, jsonError, jsonResponse } from '../_shared/gemini.ts';

const SECTION_PROMPTS: Record<string, string> = {
  hero: `Regenerá el hero de esta landing. El hero es lo primero que ve el visitante.
El título debe ser impactante (máx 60 chars). El subtítulo persuasivo (máx 120 chars).
El CTA debe generar urgencia (máx 25 chars).
Respondé con JSON: { "title": "...", "subtitle": "...", "cta_text": "...", "image_url": null }`,

  about: `Regenerá la sección "Sobre nosotros" de esta landing.
Descripción profesional pero cercana, 2-3 oraciones.
Respondé con JSON: { "title": "Sobre nosotros", "description": "...", "image_url": null }`,

  services: `Regenerá la sección de servicios de esta landing.
Incluí 3-4 servicios con nombre, descripción breve (1 oración) y precio en formato argentino.
Respondé con JSON: { "title": "Nuestros servicios", "items": [{ "name": "...", "description": "...", "price": "$XXX" }] }`,

  testimonials: `Generá 3 testimonios realistas para esta landing.
Cada testimonio tiene nombre, texto positivo (1-2 oraciones) y rating (4-5 estrellas).
Respondé con JSON: { "title": "Lo que dicen nuestros clientes", "items": [{ "name": "...", "text": "...", "rating": 5 }] }`,

  faq: `Generá 4-5 preguntas frecuentes relevantes para este tipo de negocio.
Preguntas que un cliente se haría antes de reservar.
Respondé con JSON: { "title": "Preguntas frecuentes", "items": [{ "question": "...", "answer": "..." }] }`,

  cta: `Regenerá el call to action final de esta landing.
Título motivador, descripción breve que genere urgencia, botón con acción clara.
Respondé con JSON: { "title": "...", "description": "...", "button_text": "..." }`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if (auth.error) {
      return jsonError(auth.error, 401);
    }

    const body = await req.json();
    const { landing_page_id, section_key, instructions } = body;

    if (!landing_page_id || !section_key) {
      return jsonError('landing_page_id and section_key are required');
    }

    if (!SECTION_PROMPTS[section_key]) {
      return jsonError(`Invalid section_key: ${section_key}`);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check credits
    const { data: credits } = await supabase
      .from('ai_credits')
      .select('credits_total, credits_used')
      .eq('business_id', auth.businessId)
      .single();

    const remaining = credits ? credits.credits_total - credits.credits_used : 0;
    if (remaining < 1) {
      return jsonError('Not enough credits', 403);
    }

    // Get current landing page
    const { data: landing, error: fetchError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', landing_page_id)
      .eq('business_id', auth.businessId)
      .single();

    if (fetchError || !landing) {
      return jsonError('Landing page not found', 404);
    }

    // Build context for Gemini
    const sections = landing.sections as Record<string, unknown>;
    const context = `Negocio: ${landing.business_id}
Sección a regenerar: ${section_key}
Contenido actual de otras secciones: ${JSON.stringify(sections, null, 2)}
${instructions ? `Instrucciones adicionales del usuario: ${instructions}` : ''}`;

    // Call Gemini
    const { text, tokensUsed } = await callGemini(
      context,
      SECTION_PROMPTS[section_key]
    );

    // Parse response
    let newSection;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      newSection = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini response:', text);
      return jsonError('Failed to regenerate section. Please try again.', 500);
    }

    // Update sections
    sections[section_key] = newSection;

    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        sections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', landing_page_id);

    if (updateError) {
      return jsonError('Failed to update landing page', 500);
    }

    // Consume credits
    await supabase.rpc('consume_ai_credits', {
      p_business_id: auth.businessId,
      p_credits_needed: 1,
      p_action: `${section_key}_rewrite`,
      p_metadata: JSON.stringify({
        landing_page_id,
        section_key,
        tokens_used: tokensUsed,
        instructions,
      }),
    });

    // Get updated credits
    const { data: updatedCredits } = await supabase
      .from('ai_credits')
      .select('credits_total, credits_used')
      .eq('business_id', auth.businessId)
      .single();

    return jsonResponse({
      success: true,
      section: newSection,
      credits_remaining: updatedCredits
        ? updatedCredits.credits_total - updatedCredits.credits_used
        : 0,
    });
  } catch (err) {
    console.error('ai-regenerate-section error:', err);
    return jsonError('Internal error', 500);
  }
});
