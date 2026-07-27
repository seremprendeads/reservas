import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface ProductImageSliderProps {
  images: string[];
  alt: string;
  compact?: boolean;
  className?: string;
}

export function ProductImageSlider({ images, alt, compact = false, className = '' }: ProductImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const validImages = images.filter(Boolean);
  const hasMultiple = validImages.length > 1;

  const goTo = useCallback((index: number) => {
    if (transitioning || index === current) return;
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => setTransitioning(false), 350);
  }, [current, transitioning]);

  const goPrev = useCallback(() => {
    goTo(current === 0 ? validImages.length - 1 : current - 1);
  }, [current, validImages.length, goTo]);

  const goNext = useCallback(() => {
    goTo(current === validImages.length - 1 ? 0 : current + 1);
  }, [current, validImages.length, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  useEffect(() => {
    setCurrent(0);
  }, [images]);

  if (validImages.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center rounded-2xl ${className}`} style={{ backgroundColor: 'var(--booking-primary-light)' }}>
        <Package className={compact ? 'w-10 h-10' : 'w-20 h-20'} style={{ color: 'var(--booking-primary)' }} />
      </div>
    );
  }

  const thumbSize = compact ? 'w-10 h-10' : 'w-14 h-14';
  const thumbBorder = compact ? 'border' : 'border-2';

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="aspect-square relative">
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${current * 100}%)${touchStart !== 0 ? ` translateX(${touchDelta}px)` : ''}` }}
          >
            {validImages.map((img, i) => (
              <div key={i} className="min-w-full h-full shrink-0">
                <img src={img} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
              </div>
            ))}
          </div>

          {hasMultiple && !compact && (
            <>
              <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-all duration-200 backdrop-blur-md shadow-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-all duration-200 backdrop-blur-md shadow-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {hasMultiple && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/40 text-white text-xs font-medium backdrop-blur-md shadow-sm">
              {current + 1}/{validImages.length}
            </div>
          )}
        </div>
      </div>

      {hasMultiple && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`${thumbSize} rounded-xl overflow-hidden shrink-0 ${thumbBorder} transition-all duration-200 ${i === current ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              style={{ borderColor: i === current ? 'var(--booking-primary)' : 'transparent' }}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
