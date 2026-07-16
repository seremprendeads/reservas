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

    // Generate via AIProvider
    const ai = createAIProvider();
    const { sections, tokensUsed } = await ai.generateLanding({
      businessName: business_name,
      businessType: business_type,
      services,
      city,
    });

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
