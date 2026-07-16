import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateToken, corsHeaders } from '../_shared/auth.ts';
import { callGemini, jsonError, jsonResponse } from '../_shared/gemini.ts';

const SYSTEM_INSTRUCTION = `Sos un experto en marketing digital y copywriting para negocios de servicios en Argentina.

Tu tarea es generar el contenido completo de una Landing Page profesional.

Respondé ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin texto adicional.

El JSON debe tener esta estructura exacta:
{
  "hero": {
    "title": "Título principal atractivo (máx 60 chars)",
    "subtitle": "Subtítulo persuasivo (máx 120 chars)",
    "cta_text": "Texto del botón CTA (máx 25 chars)",
    "image_url": null
  },
  "about": {
    "title": "Sobre nosotros",
    "description": "Descripción del negocio (2-3 oraciones, tono profesional cercano)",
    "image_url": null
  },
  "services": {
    "title": "Nuestros servicios",
    "items": [
      {
        "name": "Nombre del servicio",
        "description": "Descripción breve (1 oración)",
        "price": "$0"
      }
    ]
  },
  "testimonials": {
    "title": "Lo que dicen nuestros clientes",
    "items": [
      {
        "name": "Nombre del cliente",
        "text": "Testimonio breve y positivo (1-2 oraciones)",
        "rating": 5
      }
    ]
  },
  "faq": {
    "title": "Preguntas frecuentes",
    "items": [
      {
        "question": "Pregunta común del cliente",
        "answer": "Respuesta clara y breve (1-2 oraciones)"
      }
    ]
  },
  "cta": {
    "title": "¿Listo para reservar?",
    "description": "Texto motivador breve para convertir",
    "button_text": "Reservar ahora"
  }
}

Reglas:
- Español rioplatense (Argentina)
- Contenido breve y persuasivo
- Orientado a conversión (reservar turnos)
- 3-4 servicios, 3 testimonios, 4-5 FAQs
- Precios en formato argentino ($XXX o $X.XXX)
- Todos los campos deben tener contenido real, nunca strings vacíos`;

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
    const { business_name, business_type, services, city, slug } = body;

    if (!business_name || !slug) {
      return jsonError('business_name and slug are required');
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
    if (remaining < 5) {
      return jsonError('Not enough credits', 403);
    }

    // Build prompt
    const servicesList = services?.map((s: { name: string; price?: number }) =>
      `- ${s.name}${s.price ? ` ($${s.price})` : ''}`
    ).join('\n') || 'No especificados';

    const prompt = `Negocio: ${business_name}
Rubro: ${business_type || 'Servicios'}
Ciudad: ${city || 'Argentina'}
Servicios conocidos:
${servicesList}

Generá el contenido completo de la landing page para este negocio.`;

    // Call Gemini
    const { text, tokensUsed } = await callGemini(prompt, SYSTEM_INSTRUCTION);

    // Parse JSON response
    let sections;
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sections = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini response:', text);
      return jsonError('Failed to generate landing content. Please try again.', 500);
    }

    // Consume credits
    const { error: creditError } = await supabase.rpc('consume_ai_credits', {
      p_business_id: auth.businessId,
      p_credits_needed: 5,
      p_action: 'landing_generation',
      p_metadata: JSON.stringify({
        slug,
        tokens_used: tokensUsed,
        business_name,
      }),
    });

    if (creditError) {
      console.error('Credit consumption error:', creditError);
    }

    // Save or update landing page
    const { error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        business_id: auth.businessId,
        slug,
        sections,
        status: 'draft',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id,slug' });

    if (upsertError) {
      console.error('Landing page save error:', upsertError);
      return jsonError('Failed to save landing page', 500);
    }

    // Get updated credits
    const { data: updatedCredits } = await supabase
      .from('ai_credits')
      .select('credits_total, credits_used')
      .eq('business_id', auth.businessId)
      .single();

    return jsonResponse({
      success: true,
      sections,
      credits_remaining: updatedCredits
        ? updatedCredits.credits_total - updatedCredits.credits_used
        : 0,
      tokens_used: tokensUsed,
    });
  } catch (err) {
    console.error('ai-generate-landing error:', err);
    return jsonError('Internal error', 500);
  }
});
