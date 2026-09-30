import { Check } from 'lucide-react';

interface CartToastProps {
  productName: string;
  onViewCart: () => void;
}

export function CartToast({ productName, onViewCart }: CartToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="animate-fade-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg"
        style={{ backgroundColor: 'var(--booking-card-bg)', borderColor: 'var(--booking-border)' }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--booking-primary-light)' }}
        >
          <Check className="h-5 w-5" style={{ color: 'var(--booking-primary)' }} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--booking-text)' }}>
            Agregado al carrito
          </p>
          <p className="truncate text-xs" style={{ color: 'var(--booking-text-muted)' }}>
            {productName}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewCart}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--booking-primary)' }}
        >
          Ver carrito
        </button>
      </div>
    </div>
  );
}
