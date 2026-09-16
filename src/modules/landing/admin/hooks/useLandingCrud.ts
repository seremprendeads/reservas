import { useState, useCallback, useEffect } from 'react';
import { type Business } from '../../../../lib/supabase';
import { authInvoke } from '../../../../pages/admin/helpers';
import type { LandingSections, LandingPage, LandingTheme, LandingTemplate } from '../../types';
import { DEFAULT_SECTIONS, DEFAULT_THEME } from '../../config';
import { SECTION_DEFINITIONS } from '../../types';

interface UseLandingCrudOptions {
  business: Business | null;
}

interface UseLandingCrudResult {
  landing: LandingPage | null;
  sections: LandingSections;
  theme: LandingTheme;
  template: LandingTemplate;
  visibleSections: string[];
  logoUrl: string;
  slug: string;
  loading: boolean;
  saving: boolean;
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  setSections: React.Dispatch<React.SetStateAction<LandingSections>>;
  setTheme: React.Dispatch<React.SetStateAction<LandingTheme>>;
  setTemplate: React.Dispatch<React.SetStateAction<LandingTemplate>>;
  setVisibleSections: React.Dispatch<React.SetStateAction<string[]>>;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  setSlug: React.Dispatch<React.SetStateAction<string>>;
  setSaveMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>>;
  updateSection: (key: string, value: unknown) => void;
  updateTheme: (key: string, value: string) => void;
  toggleVisibleSection: (key: string) => void;
  handleSave: () => Promise<string | null>;
  handlePublish: () => Promise<void>;
}

export function useLandingCrud({ business }: UseLandingCrudOptions): UseLandingCrudResult {
  const [landing, setLanding] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingSections>(DEFAULT_SECTIONS);
  const [theme, setTheme] = useState<LandingTheme>(DEFAULT_THEME);
  const [template, setTemplate] = useState<LandingTemplate>('creative');
  const [visibleSections, setVisibleSections] = useState<string[]>(
    SECTION_DEFINITIONS.map(s => s.key)
  );
  const [logoUrl, setLogoUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLanding = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      // Antes esto leia landing_pages con la clave publica, que dejaba ver los
      // borradores de cualquier negocio. Ahora pasa por admin-manage-landing,
      // que deduce el negocio del token.
      const { data: res } = await authInvoke('admin-manage-landing', { action: 'get' });
      const data = res?.landing as any;

      if (data) {
        setLanding(data as unknown as LandingPage);
        const loadedSections = data.sections as unknown as LandingSections;
        setSections({
          ...loadedSections,
          banner: (loadedSections as any).banner || DEFAULT_SECTIONS.banner,
          map: (loadedSections as any).map || DEFAULT_SECTIONS.map,
          about_text: { ...DEFAULT_SECTIONS.about_text, ...((loadedSections as any).about_text) },
          dividers: {
            hero_about: { ...DEFAULT_SECTIONS.dividers.hero_about, ...((loadedSections as any).dividers?.hero_about) },
            cta_footer: { ...DEFAULT_SECTIONS.dividers.cta_footer, ...((loadedSections as any).dividers?.cta_footer) },
          },
        });
        setTheme({ ...DEFAULT_THEME, ...(data.theme as unknown as LandingTheme) });
        setTemplate((data.template as LandingTemplate) || 'creative');
        setSlug(data.slug || '');
        setLogoUrl(data.logo_url || '');
        if (data.visible_sections) {
          const dbSections = data.visible_sections as string[];
          const newKeys = SECTION_DEFINITIONS.map(s => s.key).filter(k => !dbSections.includes(k));
          setVisibleSections([...dbSections, ...newKeys]);
        }
      } else {
        setSlug(business.slug || 'mi-landing');
      }
    } finally {
      setLoading(false);
    }
  }, [business?.id, business?.slug]);

  useEffect(() => {
    if (business?.id) loadLanding();
  }, [business?.id, loadLanding]);

  const updateSection = useCallback((key: string, value: unknown) => {
    setSections(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateTheme = useCallback((key: string, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleVisibleSection = useCallback((key: string) => {
    setVisibleSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  const handleSave = useCallback(async (): Promise<string | null> => {
    if (!business?.id) return null;
    setSaving(true);
    setSaveMessage(null);
    try {
      // Guardar publica directo: no hay borrador ni boton aparte. Cada cambio
      // queda online al instante. La funcion decide sola si crea o actualiza,
      // buscando la landing por negocio, asi que el panel no manda ningun id.
      const { data: res, error } = await authInvoke('admin-manage-landing', {
        action: 'publish',
        sections, theme, template,
        visible_sections: visibleSections,
        logo_url: logoUrl || null,
        slug: slug || business.slug,
      });

      if (error || !res?.success) {
        throw new Error('No se pudo guardar. Intentá de nuevo.');
      }

      await loadLanding();
      setSaveMessage({ type: 'success', text: 'Guardado y publicado' });
      return res.id || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setSaveMessage({ type: 'error', text: msg });
      console.error('Save error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [business?.id, business?.slug, landing, sections, theme, template, visibleSections, logoUrl, slug, loadLanding]);

  const handlePublish = useCallback(async () => {
    if (!business?.id) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const { data: res, error } = await authInvoke('admin-manage-landing', {
        action: 'publish',
        sections, theme, template,
        visible_sections: visibleSections,
        logo_url: logoUrl || null,
        slug: slug || business.slug,
      });

      if (error || !res?.success) {
        throw new Error('No se pudo publicar. Intentá de nuevo.');
      }

      await loadLanding();
      setSaveMessage({ type: 'success', text: 'Landing publicada correctamente' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al publicar';
      setSaveMessage({ type: 'error', text: msg });
      console.error('Publish error:', err);
    } finally {
      setSaving(false);
    }
  }, [business?.id, business?.slug, landing?.id, sections, theme, template, visibleSections, logoUrl, slug, loadLanding]);

  return {
    landing,
    sections,
    theme,
    template,
    visibleSections,
    logoUrl,
    slug,
    loading,
    saving,
    saveMessage,
    setSections,
    setTheme,
    setTemplate,
    setVisibleSections,
    setLogoUrl,
    setSlug,
    setSaveMessage,
    updateSection,
    updateTheme,
    toggleVisibleSection,
    handleSave,
    handlePublish,
  };
}