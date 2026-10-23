import { ParallaxImage } from './ParallaxImage';

interface SectionBackgroundProps {
  imageUrl?: string | null;
  fixed?: boolean;
}

export function SectionBackground({ imageUrl, fixed }: SectionBackgroundProps) {
  if (!imageUrl || !fixed) return null;
  return <ParallaxImage imageUrl={imageUrl} enabled />;
}
