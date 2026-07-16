import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateToken, corsHeaders } from '../_shared/auth.ts';
import { jsonError, jsonResponse } from '../_shared/gemini.ts';
import { createAIProvider } from '../_shared/ai-provider.ts';

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

    const VALID_SECTIONS = ['hero', 'about', 'services', 'testimonials', 'faq', 'cta'];
    if (!VALID_SECTIONS.includes(section_key)) {
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

    // Regenerate via AIProvider
    const ai = createAIProvider();
    const sections = landing.sections as Record<string, unknown>;
    const { section: newSection, tokensUsed } = await ai.regenerateSection({
      sectionKey: section_key,
      currentSections: sections,
      instructions,
      businessContext: `Business ID: ${landing.business_id}`,
    });

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
