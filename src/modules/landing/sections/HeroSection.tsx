import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';
import type { HeroData } from './hero/types';
import { createDefaultHeroData, migrateHeroData } from './hero/types';
import { HeroPreview } from './hero/HeroPreview';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface HeroSectionProps {
  s: LandingSections;
  theme: LandingTheme;
  ts: TemplateStyles;
  landingLogoUrl: string | null;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function getHeroData(hero: LandingSections['hero']): HeroData {
  const h = hero as Record<string, unknown>;
  if (h.hero_template) {
    return h as unknown as HeroData;
  }
  return migrateHeroData(h);
}

export function HeroSection({
  s,
  theme,
  ts,
  headingStyle,
  bodyStyle,
  handleSmoothScroll,
}: HeroSectionProps) {
  const heroData = getHeroData(s.hero);

  return (
    <HeroPreview
      data={heroData}
      theme={theme}
      ts={ts}
      headingStyle={headingStyle}
      bodyStyle={bodyStyle}
      handleSmoothScroll={handleSmoothScroll}
    />
  );
}
