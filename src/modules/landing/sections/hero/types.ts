export type HeroTemplate = 'centered' | 'image' | 'video';

export interface HeroBaseData {
  title: string;
  subtitle: string;
  description: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
  background_color: string;
  background_image: string | null;
  overlay_opacity: number;
}

export interface HeroCenteredData extends HeroBaseData {
  hero_template: 'centered';
}

export interface HeroImageData extends HeroBaseData {
  hero_template: 'image';
  cover_image: string | null;
}

export interface HeroVideoData extends HeroBaseData {
  hero_template: 'video';
  video_url: string;
}

export type HeroData = HeroCenteredData | HeroImageData | HeroVideoData;

export const HERO_TEMPLATE_LABELS: Record<HeroTemplate, string> = {
  centered: 'Hero Centrado',
  image: 'Hero con Imagen',
  video: 'Hero con Video',
};

export const HERO_TEMPLATE_DESCRIPTIONS: Record<HeroTemplate, string> = {
  centered: 'Texto centrado con fondo de color o imagen',
  image: 'Texto a la izquierda, imagen a la derecha',
  video: 'Video de YouTube o Vimeo como fondo',
};

export function createDefaultHeroData(template: HeroTemplate, existing?: Partial<HeroBaseData>): HeroData {
  const base: HeroBaseData = {
    title: existing?.title ?? 'Tu negocio de confianza',
    subtitle: existing?.subtitle ?? 'Descripción breve de tu negocio.',
    description: existing?.description ?? '',
    primary_button_text: existing?.primary_button_text ?? 'Reservar Turno',
    primary_button_url: existing?.primary_button_url ?? '#contacto',
    secondary_button_text: existing?.secondary_button_text ?? 'Conocer más',
    secondary_button_url: existing?.secondary_button_url ?? '#nosotros',
    background_color: existing?.background_color ?? '#111827',
    background_image: existing?.background_image ?? null,
    overlay_opacity: existing?.overlay_opacity ?? 40,
  };

  switch (template) {
    case 'centered':
      return { ...base, hero_template: 'centered' };
    case 'image':
      return { ...base, hero_template: 'image', cover_image: null };
    case 'video':
      return { ...base, hero_template: 'video', video_url: '' };
  }
}

export function migrateHeroData(oldHero: Record<string, unknown>): HeroData {
  const template = (oldHero.hero_template as HeroTemplate) || 'centered';
  return createDefaultHeroData(template, {
    title: (oldHero.title as string) || 'Tu negocio de confianza',
    subtitle: (oldHero.subtitle as string) || '',
    description: (oldHero.description as string) || '',
    primary_button_text: (oldHero.cta_text as string) || '',
    primary_button_url: '#contacto',
    secondary_button_text: (oldHero.cta_secondary_text as string) || '',
    secondary_button_url: '#nosotros',
    background_color: (oldHero.background_color as string) || '#111827',
    background_image: (oldHero.image_url as string) || null,
    overlay_opacity: (oldHero.overlay_opacity as number) || 40,
  });
}
