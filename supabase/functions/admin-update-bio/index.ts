import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const body = await req.json();
    const { action, profile, links, link, linkId } = body as {
      action?: string;
      profile?: Record<string, unknown>;
      links?: { id: string; title: string; url: string; icon?: string; color?: string; is_active: boolean; sort_order: number }[];
      link?: { title: string; url: string; icon?: string; color?: string; sort_order: number };
      linkId?: string;
    };

    const supabase = createServiceClient();

    if (action === 'save_profile' && profile) {
      const allowed = [
        'slug','name','description','avatar_url','city','whatsapp','email','website',
        'social_instagram','social_tiktok','social_facebook','social_youtube',
        'social_twitter','social_linkedin','social_icon_color',
        'primary_color','title_color','description_color',
        'bg_type','bg_solid_color','bg_gradient_from','bg_gradient_to',
        'bg_image_url','bg_opacity','button_style','button_shadow',
        'website',
      ];
      const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of allowed) {
        if (k in profile) safe[k] = profile[k];
      }
      const { error } = await supabase
        .from("bio_profiles")
        .update(safe)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else if (action === 'create_profile') {
      const { data, error } = await supabase
        .from("bio_profiles")
        .insert({ ...profile, business_id: auth.businessId, admin_email: auth.admin.email })
        .select()
        .single();
      if (error) throw error;
      return jsonSuccess({ profile: data });
    } else if (action === 'save_links' && links) {
      for (const l of links) {
        const { error } = await supabase
          .from("bio_links")
          .update({ title: l.title, url: l.url, icon: l.icon, color: l.color, is_active: l.is_active, sort_order: l.sort_order })
          .eq("id", l.id);
        if (error) throw error;
      }
    } else if (action === 'add_link' && link) {
      const { data, error } = await supabase
        .from("bio_links")
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return jsonSuccess({ link: data });
    } else if (action === 'update_link' && linkId && link) {
      const { error } = await supabase
        .from("bio_links")
        .update(link)
        .eq("id", linkId);
      if (error) throw error;
    } else if (action === 'delete_link' && linkId) {
      const { error } = await supabase
        .from("bio_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    } else if (action === 'reorder_links' && links) {
      for (let i = 0; i < links.length; i++) {
        const { error } = await supabase
          .from("bio_links")
          .update({ sort_order: i })
          .eq("id", links[i].id);
        if (error) throw error;
      }
    } else {
      return jsonError("Acción no válida", 400);
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-bio error:", err);
    return jsonError("Error al guardar bio");
  }
});
