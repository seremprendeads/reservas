interface SuspendedScreenProps {
  message: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  paymentButtonUrl?: string;
}

export function SuspendedScreen({ message, supportWhatsapp, supportEmail, paymentButtonUrl }: SuspendedScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="font-display mb-3 text-center text-xl font-semibold text-gray-900">
          Suscripción suspendida
        </h2>
        <p className="mb-8 text-center text-sm leading-relaxed text-gray-500">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          {paymentButtonUrl && (
            <a
              href={paymentButtonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-6 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-200 hover:from-red-700 hover:to-orange-600 hover:shadow-xl active:scale-[0.97]"
            >
              Actualizar Plan
            </a>
          )}
          {supportWhatsapp && (
            <a
              href={`https://wa.me/${supportWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-green-500 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-600"
            >
              Contactar por WhatsApp
            </a>
          )}
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
            >
              Enviar email
            </a>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by BookingBio
        </p>
      </div>
    </div>
  );
}
