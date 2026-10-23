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
  parallax?: boolean;
}

export function HeroPreview({ data, theme, ts, headingStyle, bodyStyle, handleSmoothScroll, parallax }: HeroPreviewProps) {
  switch (data.hero_template) {
    case 'centered':
      return <HeroCentered data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} parallax={parallax} />;
    case 'image':
      return <HeroImage data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} parallax={parallax} />;
    case 'video':
      return <HeroVideo data={data} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} parallax={parallax} />;
    default:
      return <HeroCentered data={{ ...(data as any), hero_template: 'centered' } as any} theme={theme} ts={ts} headingStyle={headingStyle} bodyStyle={bodyStyle} handleSmoothScroll={handleSmoothScroll} parallax={parallax} />;
  }
}
