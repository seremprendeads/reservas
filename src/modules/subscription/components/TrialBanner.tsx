interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const totalDays = 14;
  const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white">
          Prueba gratuita
        </h3>
        <span className="font-display text-sm font-medium text-white/80">
          {daysRemaining} días restantes
        </span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <button
        type="button"
        className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-200 hover:bg-white/90"
      >
        Mejorar plan
      </button>
    </div>
  );
}
