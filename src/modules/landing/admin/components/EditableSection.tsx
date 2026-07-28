import { type ReactNode } from 'react';
import { cn } from '../../../../lib/utils';

interface EditableSectionProps {
  sectionKey: string;
  label: string;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: (key: string) => void;
  children: ReactNode;
}

const SECTION_TAB_MAP: Record<string, string> = {
  header: 'menu',
  hero: 'hero',
  about: 'about',
  about_text: 'about_text',
  main_service: 'main_service',
  secondary_services: 'services',
  why_choose_us: 'why',
  gallery: 'gallery',
  banner: 'banner',
  shop_invite: 'shop_invite',
  testimonials: 'testimonials',
  faq: 'faq',
  cta: 'cta',
  map: 'map',
  footer: 'footer',
  popup: 'popup',
};

export function EditableSection({ sectionKey, label, isEditing, isSelected, onSelect, children }: EditableSectionProps) {
  if (!isEditing) return <>{children}</>;

  return (
    <div
      data-section-key={sectionKey}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(sectionKey);
      }}
      className={cn(
        'relative transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-transparent rounded-lg'
      )}
    >
      {children}
      <div
        className={cn(
          'absolute top-2 right-2 z-50 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium shadow-lg transition-opacity duration-200',
          isSelected
            ? 'bg-blue-500 text-white opacity-100'
            : 'bg-background/80 text-muted-foreground opacity-0 hover:opacity-100'
        )}
        style={{ pointerEvents: 'none' }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {label}
      </div>
    </div>
  );
}
