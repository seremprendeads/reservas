import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateToken, corsHeaders } from '../_shared/auth.ts';
import { jsonError, jsonResponse } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if (auth.error) {
      return jsonError(auth.error, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { data, error, count } = await supabase
      .from('ai_usage_history')
      .select('*', { count: 'exact' })
      .eq('business_id', auth.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return jsonError('Failed to fetch usage history', 500);
    }

    return jsonResponse({
      history: data || [],
      total: count || 0,
    });
  } catch (err) {
    console.error('ai-usage-history error:', err);
    return jsonError('Internal error', 500);
  }
});
