import type { LandingSections, LandingPage, LandingTheme, LandingTemplate } from '../../types';
import { SECTION_DEFINITIONS } from '../../types';
import { LandingPage as LandingPageComponent } from '../../pages/LandingPage';

interface PreviewPanelProps {
  sections: LandingSections;
  theme: LandingTheme;
  template: LandingTemplate;
  slug: string;
  logoUrl: string;
}

export function PreviewPanel({ sections, theme, template, slug, logoUrl }: PreviewPanelProps) {
  const previewData: LandingPage = {
    id: 'preview',
    business_id: 'preview',
    slug,
    template,
    sections: sections as unknown as Record<string, unknown>,
    theme: theme as unknown as Record<string, unknown>,
    status: 'published',
    visible_sections: SECTION_DEFINITIONS.map(s => s.key),
    logo_url: logoUrl || null,
    seo: { title: '', description: '', og_image: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <LandingPageComponent initialData={previewData} isPreview />;
}
