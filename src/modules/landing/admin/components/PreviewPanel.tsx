import type { LandingSections, LandingPage, LandingTheme, LandingTemplate } from '../../types';
import { LandingPage as LandingPageComponent } from '../../pages/LandingPage';
import { MaintenancePage } from '../../components/MaintenancePage';

interface PreviewPanelProps {
  sections: LandingSections;
  theme: LandingTheme;
  template: LandingTemplate;
  slug: string;
  logoUrl: string;
  visibleSections: string[];
  previewMaintenance?: boolean;
}

export function PreviewPanel({ sections, theme, template, slug, logoUrl, visibleSections, previewMaintenance }: PreviewPanelProps) {
  if (previewMaintenance && sections.maintenance?.enabled) {
    return (
      <MaintenancePage
        maintenance={sections.maintenance}
        theme={theme}
        logoUrl={logoUrl || sections.header.logo_image_url}
        footer={sections.footer}
      />
    );
  }

  const previewData: LandingPage = {
    id: 'preview',
    business_id: 'preview',
    slug,
    template,
    sections: sections as unknown as Record<string, unknown>,
    theme: theme as unknown as Record<string, unknown>,
    status: 'published',
    visible_sections: visibleSections,
    logo_url: logoUrl || null,
    seo: { title: '', description: '', og_image: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <LandingPageComponent initialData={previewData} isPreview />;
}
