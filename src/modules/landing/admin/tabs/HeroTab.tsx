import type { LandingSections } from '../../types';
import type { HeroData, HeroTemplate } from '../../sections/hero/types';
import { createDefaultHeroData, migrateHeroData } from '../../sections/hero/types';
import { HeroSelector } from '../components/hero/HeroSelector';
import { HeroForm } from '../components/hero/HeroForm';

interface HeroTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

function getHeroData(sections: LandingSections): HeroData {
  const h = sections.hero as Record<string, unknown>;
  if (h.hero_template) {
    return h as unknown as HeroData;
  }
  return migrateHeroData(h);
}

export function HeroTab({ sections, updateSection, triggerUpload, uploadingImage }: HeroTabProps) {
  const heroData = getHeroData(sections);

  const handleTemplateChange = (template: HeroTemplate) => {
    const newData = createDefaultHeroData(template, {
      title: heroData.title,
      subtitle: heroData.subtitle,
      description: heroData.description,
      primary_button_text: heroData.primary_button_text,
      primary_button_url: heroData.primary_button_url,
      secondary_button_text: heroData.secondary_button_text,
      secondary_button_url: heroData.secondary_button_url,
    });
    updateSection('hero', newData);
  };

  const handleDataChange = (data: HeroData) => {
    updateSection('hero', data);
  };

  return (
    <div className="space-y-5">
      <HeroSelector value={heroData.hero_template} onChange={handleTemplateChange} />
      <div className="border-t pt-5">
        <HeroForm data={heroData} onChange={handleDataChange} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
      </div>
    </div>
  );
}
