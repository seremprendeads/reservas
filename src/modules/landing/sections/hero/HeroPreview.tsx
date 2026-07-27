import type { HeroData } from './types';
import type { LandingTheme } from '../../types';
import type { TEMPLATE_STYLES } from '../../config';
import { HeroCentered } from './HeroCentered';
import { HeroImage } from './HeroImage';
import { HeroVideo } from './HeroVideo';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface HeroPreviewProps {
  data: HeroData;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function HeroPreview({ data, theme, ts, headingStyle, bodyStyle, handleSmoothScroll }: HeroPreviewProps) {
  switch (data.hero_template) {
    case 'centered':
      return <HeroCentered data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} />;
    case 'image':
      return <HeroImage data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} />;
    case 'video':
      return <HeroVideo data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} />;
    default:
      return <HeroCentered data={{ ...data, hero_template: 'centered' }} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} />;
  }
}
