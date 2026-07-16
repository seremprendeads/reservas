import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Wand2, Eye, EyeOff, Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { supabase, type Business } from '../../../lib/supabase';
import { AiCreditsIndicator } from './AiCreditsIndicator';
import { AiUsageHistory } from './AiUsageHistory';
import { AiNoCreditsModal } from './AiNoCreditsModal';
import { DEFAULT_SECTIONS, DEFAULT_THEME, LANDING_SECTIONS } from '../config';
import type { LandingSections, LandingPage } from '../types';

function aiInvoke(fnName: string, body: Record<string, unknown> = {}) {
  const token = sessionStorage.getItem('admin_token') || '';
  return supabase.functions.invoke(fnName, {
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

interface Props {
  business: Business | null;
}

export function LandingAdmin({ business }: Props) {
  const [landing, setLanding] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingSections>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [showPreview, setShowPreview] = useState(false);
  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');

  const loadLanding = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLanding(data as LandingPage);
        setSections(data.sections as LandingSections);
        setSlug(data.slug || '');
      } else {
        setSlug(business.slug || 'mi-landing');
        setBusinessName(business.name || '');
      }
    } finally {
      setLoading(false);
    }
  }, [business?.id, business?.slug, business?.name]);

  useEffect(() => { loadLanding(); }, [loadLanding]);

  const updateSection = (key: string, value: unknown) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const updateSectionItem = (sectionKey: string, index: number, field: string, value: unknown) => {
    setSections((prev) => {
      const section = prev[sectionKey as keyof LandingSections] as { items?: Record<string, unknown>[] };
      if (!section?.items) return prev;
      const items = [...section.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [sectionKey]: { ...section, items } };
    });
  };

  const addItem = (sectionKey: string) => {
    setSections((prev) => {
      const section = prev[sectionKey as keyof LandingSections] as { items?: Record<string, unknown>[] };
      if (!section) return prev;
      const templates: Record<string, Record<string, unknown>> = {
        services: { name: '', description: '', price: '' },
        testimonials: { name: '', text: '', rating: 5 },
        faq: { question: '', answer: '' },
      };
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          items: [...(section.items || []), templates[sectionKey] || { name: '', description: '' }],
        },
      };
    });
  };

  const removeItem = (sectionKey: string, index: number) => {
    setSections((prev) => {
      const section = prev[sectionKey as keyof LandingSections] as { items?: unknown[] };
      if (!section?.items) return prev;
      const items = section.items.filter((_, i) => i !== index);
      return { ...prev, [sectionKey]: { ...section, items } };
    });
  };

  const handleGenerate = async () => {
    if (!business?.id) return;
    setGenerating(true);
    try {
      const { data, error } = await aiInvoke('ai-generate-landing', {
        business_name: businessName || business.name,
        business_type: businessType,
        services: [],
        city: city,
        slug: slug || business.slug,
      });

      const errMsg = typeof error === 'string' ? error : error?.message || '';
      const dataErr = data?.error || '';

      if (errMsg.includes('401') || errMsg.includes('No autorizado')) {
        console.error('Auth error - token missing or invalid');
        return;
      }

      if (!data?.success || errMsg || dataErr) {
        if (String(dataErr).includes('Not enough credits') || String(errMsg).includes('403')) {
          setNoCreditsOpen(true);
          return;
        }
        if (dataErr && !data?.success) {
          throw new Error(dataErr);
        }
        if (errMsg && !data?.success) {
          throw new Error(errMsg);
        }
      }

      if (data?.sections) {
        setSections(data.sections);
        setCreditsRemaining(data.credits_remaining);
        await loadLanding();
      }
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (sectionKey: string) => {
    if (!landing?.id) return;
    setRegenerating(sectionKey);
    try {
      const { data, error } = await aiInvoke('ai-regenerate-section', {
        landing_page_id: landing.id,
        section_key: sectionKey,
      });

      const errMsg = typeof error === 'string' ? error : error?.message || '';
      const dataErr = data?.error || '';

      if (errMsg.includes('401') || errMsg.includes('No autorizado')) {
        console.error('Auth error - token missing or invalid');
        return;
      }

      if (!data?.success || errMsg || dataErr) {
        if (String(dataErr).includes('Not enough credits') || String(errMsg).includes('403')) {
          setNoCreditsOpen(true);
          return;
        }
        if (dataErr && !data?.success) {
          throw new Error(dataErr);
        }
        if (errMsg && !data?.success) {
          throw new Error(errMsg);
        }
      }

      if (data?.section) {
        setSections((prev) => ({ ...prev, [sectionKey]: data.section }));
        setCreditsRemaining(data.credits_remaining);
      }
    } catch (err) {
      console.error('Regenerate error:', err);
    } finally {
      setRegenerating(null);
    }
  };

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      if (landing?.id) {
        await supabase
          .from('landing_pages')
          .update({ sections, updated_at: new Date().toISOString() })
          .eq('id', landing.id);
      } else {
        await supabase
          .from('landing_pages')
          .insert({
            business_id: business.id,
            slug: slug || business.slug,
            sections,
            theme: DEFAULT_THEME,
            status: 'draft',
          });
        await loadLanding();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      const targetId = landing?.id;
      if (targetId) {
        await supabase
          .from('landing_pages')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', targetId);
      } else {
        await handleSave();
        if (landing?.id) {
          await supabase
            .from('landing_pages')
            .update({ status: 'published' })
            .eq('id', landing.id);
        }
      }
      await loadLanding();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasLanding = !!landing;
  const currentSection = LANDING_SECTIONS.find((s) => s.key === activeSection);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AiNoCreditsModal open={noCreditsOpen} onClose={() => setNoCreditsOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Landing IA
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creá una landing page profesional con ayuda de inteligencia artificial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? 'Editor' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Credits + Generate */}
      {!hasLanding && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="font-semibold font-display">Generar Landing con IA</h3>
                <p className="text-sm text-muted-foreground">
                  Completá los datos de tu negocio y la IA generará el contenido inicial de tu landing page.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nombre del negocio</label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej: Spa Relax"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Rubro</label>
                    <Input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="Ej: Salón de belleza"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Buenos Aires"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Slug de la landing</label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="mi-landing"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !businessName}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generar Landing (5 créditos)
                </Button>
              </div>
              <div className="w-full md:w-64 shrink-0">
                <AiCreditsIndicator businessId={business?.id || ''} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      {hasLanding && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Sections */}
          <div className="lg:col-span-1 space-y-4">
            <AiCreditsIndicator
              businessId={business?.id || ''}
              onNoCredits={() => setNoCreditsOpen(true)}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display">Secciones</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {LANDING_SECTIONS.map(({ key, label, icon }) => {
                    const IconMap: Record<string, typeof Sparkles> = {
                      Sparkles, Info: Sparkles, Wrench: Sparkles,
                      Star: Sparkles, HelpCircle: Sparkles, MousePointerClick: Sparkles,
                    };
                    const SIcon = IconMap[icon] || Sparkles;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          activeSection === key
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <SIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                        <Wand2
                          className={`h-3 w-3 ml-auto shrink-0 cursor-pointer opacity-50 hover:opacity-100 ${
                            regenerating === key ? 'animate-spin' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerate(key);
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display">Historial de Uso</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <AiUsageHistory businessId={business?.id || ''} />
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            {showPreview ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-4 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Preview de la landing en /landing/{slug}</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <a href={`/landing/${slug}`} target="_blank">Abrir preview</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display">
                      {currentSection?.label || 'Sección'}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate(activeSection)}
                      disabled={regenerating !== null}
                    >
                      {regenerating === activeSection ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-1" />
                      )}
                      Regenerar con IA
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hero */}
                  {activeSection === 'hero' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título principal</label>
                        <Input
                          value={sections.hero.title}
                          onChange={(e) => updateSection('hero', { ...sections.hero, title: e.target.value })}
                          placeholder="Tu negocio de confianza"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
                        <Input
                          value={sections.hero.subtitle}
                          onChange={(e) => updateSection('hero', { ...sections.hero, subtitle: e.target.value })}
                          placeholder="Descripción breve de tu negocio"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Texto del botón CTA</label>
                        <Input
                          value={sections.hero.cta_text}
                          onChange={(e) => updateSection('hero', { ...sections.hero, cta_text: e.target.value })}
                          placeholder="Reservá tu turno"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}

                  {/* About */}
                  {activeSection === 'about' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título</label>
                        <Input
                          value={sections.about.title}
                          onChange={(e) => updateSection('about', { ...sections.about, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                        <textarea
                          value={sections.about.description}
                          onChange={(e) => updateSection('about', { ...sections.about, description: e.target.value })}
                          rows={4}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </>
                  )}

                  {/* Services */}
                  {activeSection === 'services' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
                        <Input
                          value={sections.services.title}
                          onChange={(e) => updateSection('services', { ...sections.services, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      {sections.services.items.map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Servicio {i + 1}</span>
                            <Trash2 className="h-3.5 w-3.5 text-destructive cursor-pointer" onClick={() => removeItem('services', i)} />
                          </div>
                          <Input
                            value={item.name}
                            onChange={(e) => updateSectionItem('services', i, 'name', e.target.value)}
                            placeholder="Nombre del servicio"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateSectionItem('services', i, 'description', e.target.value)}
                            placeholder="Descripción"
                          />
                          <Input
                            value={item.price}
                            onChange={(e) => updateSectionItem('services', i, 'price', e.target.value)}
                            placeholder="Precio ($0)"
                          />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addItem('services')}>
                        <Plus className="h-4 w-4 mr-1" /> Agregar servicio
                      </Button>
                    </>
                  )}

                  {/* Testimonials */}
                  {activeSection === 'testimonials' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
                        <Input
                          value={sections.testimonials.title}
                          onChange={(e) => updateSection('testimonials', { ...sections.testimonials, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      {sections.testimonials.items.map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Testimonio {i + 1}</span>
                            <Trash2 className="h-3.5 w-3.5 text-destructive cursor-pointer" onClick={() => removeItem('testimonials', i)} />
                          </div>
                          <Input
                            value={item.name}
                            onChange={(e) => updateSectionItem('testimonials', i, 'name', e.target.value)}
                            placeholder="Nombre del cliente"
                          />
                          <textarea
                            value={item.text}
                            onChange={(e) => updateSectionItem('testimonials', i, 'text', e.target.value)}
                            placeholder="Testimonio"
                            rows={2}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addItem('testimonials')}>
                        <Plus className="h-4 w-4 mr-1" /> Agregar testimonio
                      </Button>
                    </>
                  )}

                  {/* FAQ */}
                  {activeSection === 'faq' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
                        <Input
                          value={sections.faq.title}
                          onChange={(e) => updateSection('faq', { ...sections.faq, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      {sections.faq.items.map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">FAQ {i + 1}</span>
                            <Trash2 className="h-3.5 w-3.5 text-destructive cursor-pointer" onClick={() => removeItem('faq', i)} />
                          </div>
                          <Input
                            value={item.question}
                            onChange={(e) => updateSectionItem('faq', i, 'question', e.target.value)}
                            placeholder="Pregunta"
                          />
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateSectionItem('faq', i, 'answer', e.target.value)}
                            placeholder="Respuesta"
                            rows={2}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addItem('faq')}>
                        <Plus className="h-4 w-4 mr-1" /> Agregar FAQ
                      </Button>
                    </>
                  )}

                  {/* CTA */}
                  {activeSection === 'cta' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título</label>
                        <Input
                          value={sections.cta.title}
                          onChange={(e) => updateSection('cta', { ...sections.cta, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                        <Input
                          value={sections.cta.description}
                          onChange={(e) => updateSection('cta', { ...sections.cta, description: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Texto del botón</label>
                        <Input
                          value={sections.cta.button_text}
                          onChange={(e) => updateSection('cta', { ...sections.cta, button_text: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Save / Publish */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                {landing?.status === 'published' ? (
                  <span className="text-emerald-600 font-medium">● Publicada</span>
                ) : (
                  <span className="text-amber-600 font-medium">● Borrador</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Guardar
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                >
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
