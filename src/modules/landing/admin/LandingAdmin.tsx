import { useState } from 'react';
import { Eye, Save, Loader2, Globe } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import type { Business } from '../../../lib/supabase';
import { ADMIN_TABS, type AdminTab } from './lib/constants';
import { useLandingCrud } from './hooks/useLandingCrud';
import { useLandingUpload } from './hooks/useLandingUpload';
import { PreviewPanel } from './components/PreviewPanel';
import { GeneralTab } from './tabs/GeneralTab';
import { MenuTab } from './tabs/MenuTab';
import { HeroTab } from './tabs/HeroTab';
import { AboutTab } from './tabs/AboutTab';
import { AboutTextTab } from './tabs/AboutTextTab';
import { MainServiceTab } from './tabs/MainServiceTab';
import { ServicesTab } from './tabs/ServicesTab';
import { WhyChooseUsTab } from './tabs/WhyChooseUsTab';
import { GalleryTab } from './tabs/GalleryTab';
import { BannerTab } from './tabs/BannerTab';
import { TestimonialsTab } from './tabs/TestimonialsTab';
import { FaqTab } from './tabs/FaqTab';
import { CtaTab } from './tabs/CtaTab';
import { PlansTab } from './tabs/PlansTab';
import { MapTab } from './tabs/MapTab';
import { FooterTab } from './tabs/FooterTab';
import { DesignTab } from './tabs/DesignTab';
import { PopupTab } from './tabs/PopupTab';
import { ShopInviteTab } from './tabs/ShopInviteTab';
import { SeoMarketingTab } from './tabs/SeoMarketingTab';
import { DividersTab } from './tabs/DividersTab';
import { FileJson } from 'lucide-react';

interface Props {
  business: Business | null;
  activeTab?: AdminTab | null;
  setActiveTab?: (tab: AdminTab | null) => void;
}

export function LandingAdmin({ business, activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }: Props) {
  const {
    landing, sections, theme, template, visibleSections, logoUrl, slug,
    loading, saving, saveMessage,
    setSections, setTheme, setTemplate, setVisibleSections, setLogoUrl, setSlug, setSaveMessage,
    updateSection, updateTheme, toggleVisibleSection, handleSave,
  } = useLandingCrud({ business });

  const { uploadingImage, uploadError, clearUploadError, fileInputRef, handleImageUpload, triggerUpload } = useLandingUpload({ business, setLogoUrl, setSections });

  const [localActiveTab, setLocalActiveTab] = useState<AdminTab | null>(null);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : localActiveTab;
  const setActiveTab = externalSetActiveTab ?? setLocalActiveTab;

  const handleSaveAndClose = async () => {
    await handleSave();
    setActiveTab(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {uploadError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <span className="shrink-0">Error:</span>
          <span>{uploadError}</span>
          <button onClick={clearUploadError} className="ml-auto shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      {saveMessage && (
        <div className={`rounded-xl border p-3 text-sm flex items-center gap-2 ${
          saveMessage.type === 'success'
            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        }`}>
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage(null)} className="ml-auto shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Landing Page
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab ? ADMIN_TABS.find(t => t.id === activeTab)?.label : 'Seleccioná una sección desde el menú'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <Button variant="outline" size="sm" asChild>
              {/* El negocio "bioweblink" es la web madre del producto: vive en
                  la raiz del dominio (bioweblink.com), no en /bioweblink. */}
              <a href={slug === 'bioweblink' ? '/' : `/landing/${encodeURIComponent(slug)}`} target="_blank" className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> Ver sitio web
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-8">

        {/* Panel de edición — solo visible cuando hay tab activo */}
        {activeTab && (
          <div className="w-full lg:w-[420px] shrink-0">
            <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
              <CardContent key={activeTab} className="space-y-5 pt-5">
                {activeTab === 'general' && (
                  <GeneralTab
                    slug={slug} setSlug={setSlug}
                    visibleSections={visibleSections} toggleVisibleSection={toggleVisibleSection}
                    theme={theme} updateTheme={updateTheme}
                  />
                )}
                {activeTab === 'menu' && (
                  <MenuTab
                    sections={sections} updateSection={updateSection}
                    theme={theme} updateTheme={updateTheme}
                    logoUrl={logoUrl} triggerUpload={triggerUpload} uploadingImage={uploadingImage}
                  />
                )}
                {activeTab === 'hero' && (
                  <HeroTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'about' && (
                  <AboutTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'about_text' && (
                  <AboutTextTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'main_service' && (
                  <MainServiceTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'services' && (
                  <ServicesTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'why' && (
                  <WhyChooseUsTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'gallery' && (
                  <GalleryTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'banner' && (
                  <BannerTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'shop_invite' && (
                  <ShopInviteTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'testimonials' && (
                  <TestimonialsTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'faq' && (
                  <FaqTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'cta' && (
                  <CtaTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'plans' && (
                  <PlansTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'map' && (
                  <MapTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'popup' && (
                  <PopupTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'seo_marketing' && (
                  <SeoMarketingTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
                )}
                {activeTab === 'footer' && (
                  <FooterTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} theme={theme} updateTheme={updateTheme} />
                )}
                {activeTab === 'design' && (
                  <DesignTab theme={theme} updateTheme={updateTheme} businessId={business?.id || ''} />
                )}
                {activeTab === 'dividers' && (
                  <DividersTab sections={sections} updateSection={updateSection} theme={theme} />
                )}
                {activeTab === 'preset_json' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileJson className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-medium text-foreground">Plantilla JSON</h3>
                      </div>
                      <p className="text-sm text-foreground/60">
                        Pegá solo el JSON con <code className="text-xs bg-muted px-1 py-0.5 rounded">template</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">sections</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">theme</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">visible_sections</code>. Se aplica únicamente a esta landing.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">JSON de plantilla</label>
                      <textarea
                        id="preset-json-textarea"
                        placeholder='{\n  "template": "legal",\n  "sections": {...},\n  "theme": {...},\n  "visible_sections": ["header", "hero", ...]\n}'
                        rows={20}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                      />
                    </div>
                    <Button onClick={() => {
                      const ta = document.getElementById('preset-json-textarea') as HTMLTextAreaElement;
                      const txt = ta?.value || '';
                      if (!txt.trim()) { alert('Pegá el JSON primero'); return; }
                      try {
                        const parsed = JSON.parse(txt);
                        if (parsed.template) setTemplate(parsed.template);
                        if (parsed.sections) setSections(parsed.sections);
                        if (parsed.theme) setTheme(parsed.theme);
                        if (parsed.visible_sections) setVisibleSections(parsed.visible_sections);
                        alert('Plantilla aplicada correctamente. Guardá desde el constructor.');
                        ta.value = '';
                      } catch(e) { alert('JSON inválido'); }
                    }} className="w-full">
                      Aplicar a esta landing
                    </Button>
                    <div className="text-xs text-foreground/50 space-y-1">
                      <p>• Solo afecta esta landing, no a otros negocios</p>
                      <p>• El cliente podrá modificar textos, imágenes, equipo, FAQ, etc. desde las otras pestañas</p>
                      <p>• Después de aplicar, guardá desde el constructor normal</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-5 space-y-3">
              <p className="text-xs text-muted-foreground">
                {landing?.status === 'published' ? (
                  <span className="text-emerald-600 font-medium">● Publicada</span>
                ) : (
                  <span className="text-amber-600 font-medium">● Borrador</span>
                )}
              </p>
              <Button onClick={handleSaveAndClose} disabled={saving} className="w-full gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        )}

        {/* Vista previa — ocupa todo el espacio restante */}
        <div className="flex-1 min-w-0">
          <Card className="lg:sticky lg:top-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
            <CardContent className="p-0 overflow-hidden">
              <div className="bg-muted/30 px-6 py-3 border-b">
                <span className="text-xs font-medium text-muted-foreground">Vista previa</span>
              </div>
              <div data-preview-container className="h-[600px] overflow-auto">
                <PreviewPanel sections={sections} theme={theme} template={template} slug={slug} logoUrl={logoUrl} visibleSections={visibleSections} />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}