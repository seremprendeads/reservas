import { useState } from 'react';
import { Eye, Save, Loader2, Globe, PanelLeftClose } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { supabase, type Business } from '../../../lib/supabase';
import { DEFAULT_THEME } from '../config';
import { SECTION_DEFINITIONS } from '../../types';
import { ADMIN_TABS, type AdminTab } from './lib/constants';
import { useLandingCrud } from './hooks/useLandingCrud';
import { useLandingUpload } from './hooks/useLandingUpload';
import { Sidebar } from './components/Sidebar';
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
import { MapTab } from './tabs/MapTab';
import { FooterTab } from './tabs/FooterTab';
import { DesignTab } from './tabs/DesignTab';
import { PopupTab } from './tabs/PopupTab';
import { ShopInviteTab } from './tabs/ShopInviteTab';
import { SeoMarketingTab } from './tabs/SeoMarketingTab';

interface Props {
  business: Business | null;
}

export function LandingAdmin({ business }: Props) {
  const {
    landing, sections, theme, template, visibleSections, logoUrl, slug,
    loading, saving, saveMessage,
    setSections, setTheme, setTemplate, setVisibleSections, setLogoUrl, setSlug, setSaveMessage,
    updateSection, updateTheme, toggleVisibleSection, handleSave,
  } = useLandingCrud({ business });

  const { uploadingImage, uploadError, clearUploadError, fileInputRef, handleImageUpload, triggerUpload } = useLandingUpload({ business, setLogoUrl, setSections });

  const [activeTab, setActiveTab] = useState<AdminTab | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    secciones: false, engagement: false, config: false,
  });
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const SECTION_TO_TAB: Record<string, AdminTab> = {
    header: 'menu', hero: 'hero', about: 'about', about_text: 'about_text',
    main_service: 'main_service', secondary_services: 'services',
    why_choose_us: 'why', gallery: 'gallery', banner: 'banner',
    shop_invite: 'shop_invite', testimonials: 'testimonials', faq: 'faq',
    cta: 'cta', map: 'map', footer: 'footer', popup: 'popup',
  };

  const handleSelectSection = (sectionKey: string) => {
    setSelectedSection(sectionKey);
    const tab = SECTION_TO_TAB[sectionKey];
    if (tab) {
      setActiveTab(tab);
      setPanelCollapsed(false);
      setContentCollapsed(false);
    }
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
            Creá una landing page profesional para tu negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/${encodeURIComponent(slug)}`} target="_blank" className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> Ver sitio web
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setContentCollapsed(false); }}
          panelCollapsed={panelCollapsed}
          setPanelCollapsed={setPanelCollapsed}
          openGroups={openGroups}
          setOpenGroups={setOpenGroups}
        />

        {activeTab && !contentCollapsed ? (
        <div className="w-[420px] shrink-0">
          <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display">
                {ADMIN_TABS.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <button
                onClick={() => setContentCollapsed(true)}
                className="rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-accent-foreground transition-all duration-200"
                title="Colapsar panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent key={activeTab} className="space-y-5">
              {activeTab === 'general' && (
                <GeneralTab
                  slug={slug} setSlug={setSlug}
                  template={template} setTemplate={setTemplate}
                  visibleSections={visibleSections} toggleVisibleSection={toggleVisibleSection}
                  logoUrl={logoUrl} triggerUpload={triggerUpload}
                  uploadingImage={uploadingImage}
                  sections={sections} updateSection={updateSection}
                />
              )}
              {activeTab === 'menu' && (
                <MenuTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'hero' && (
                <HeroTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'about' && (
                <AboutTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'about_text' && (
                <AboutTextTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'main_service' && (
                <MainServiceTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'services' && (
                <ServicesTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'why' && (
                <WhyChooseUsTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'gallery' && (
                <GalleryTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'banner' && (
                <BannerTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'shop_invite' && (
                <ShopInviteTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'testimonials' && (
                <TestimonialsTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'faq' && (
                <FaqTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'cta' && (
                <CtaTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'map' && (
                <MapTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'popup' && (
                <PopupTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'seo_marketing' && (
                <SeoMarketingTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
              )}
              {activeTab === 'footer' && (
                <FooterTab sections={sections} updateSection={updateSection} />
              )}
              {activeTab === 'design' && (
                <DesignTab theme={theme} updateTheme={updateTheme} businessId={business?.id || ''} />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-muted-foreground">
              {landing?.status === 'published' ? (
                <span className="text-emerald-600 font-medium">● Publicada</span>
              ) : (
                <span className="text-amber-600 font-medium">● Borrador</span>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <Card className="sticky top-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
            <CardContent className="p-0 overflow-hidden">
              <div className="bg-muted/30 px-6 py-3 border-b">
                <span className="text-xs font-medium text-muted-foreground">Vista previa</span>
              </div>
              <div data-preview-container className="h-[600px] overflow-auto">
                <PreviewPanel sections={sections} theme={theme} template={template} slug={slug} logoUrl={logoUrl} isEditing selectedSection={selectedSection || undefined} onSelectSection={handleSelectSection} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
