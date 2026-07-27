interface ExpiringPopupProps {
  daysRemaining: number;
}

export function ExpiringPopup({ daysRemaining }: ExpiringPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,.10)] transition-all duration-200">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="font-display mb-2 text-center text-xl font-semibold text-gray-900">
          Tu suscripción está por vencer
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-gray-500">
          {daysRemaining === 1
            ? `Te queda ${daysRemaining} día de acceso. Renueva ahora para no interrumpir tu servicio.`
            : `Te quedan ${daysRemaining} días de acceso. Renueva ahora para no interrumpir tu servicio.`}
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="#"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700"
          >
            Renovar ahora
          </a>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
          >
            Recordarme después
          </button>
        </div>
      </div>
    </div>
  );
}
