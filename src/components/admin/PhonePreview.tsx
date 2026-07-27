import { ExternalLink } from 'lucide-react';

interface PhonePreviewProps {
  bgColor: string;
  primaryColor: string;
  headerOpacity: number;
  logoUrl: string;
  title: string;
  subtitle: string;
  mutedColor: string;
  textColor: string;
  cardBgColor: string;
  bgImageUrl: string;
  overlayColor: string;
  bgOpacity: number;
  businessSlug: string;
}

export function PhonePreview({
  bgColor,
  primaryColor,
  headerOpacity,
  logoUrl,
  title,
  subtitle,
  mutedColor,
  textColor,
  cardBgColor,
  bgImageUrl,
  overlayColor,
  bgOpacity,
  businessSlug,
}: PhonePreviewProps) {
  const previewHasOverlay = bgImageUrl && bgOpacity > 0;

  return (
    <div className="lg:col-span-2">
      <div className="sticky top-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vista previa</p>
          <a href={`/${businessSlug || '...'}/reservas`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> Ver reservas
          </a>
        </div>

        {/* Phone frame */}
        <div className="mx-auto max-w-[270px]">
          <div className="rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="rounded-[2rem] overflow-hidden" style={{ background: bgColor }}>

              {/* Status bar */}
              <div className="h-6 flex items-center justify-center">
                <div className="w-16 h-4 rounded-b-2xl bg-gray-900" />
              </div>

              {/* Header */}
              <div style={{
                backgroundColor: `${primaryColor}${Math.round((headerOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
              }}>
                <div className="px-4 py-3 flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: primaryColor }}>
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate" style={{ color: textColor }}>{title || 'Reserva tu Turno'}</span>
                    {subtitle && <span className="text-[10px] block truncate" style={{ color: mutedColor }}>{subtitle}</span>}
                  </div>
                </div>
              </div>

              {/* Background + Overlay */}
              <div className="relative">
                {previewHasOverlay && (
                  <div className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: `url(${bgImageUrl})` }}>
                    <div className="absolute inset-0"
                      style={{ backgroundColor: `${overlayColor}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}` }} />
                  </div>
                )}

                <div className="relative z-10 px-4 py-5 space-y-4">
                  {/* Progress steps */}
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="flex items-center">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium"
                          style={{
                            backgroundColor: n <= 2 ? primaryColor : '#e5e7eb',
                            color: n <= 2 ? '#fff' : '#9ca3af',
                          }}>{n}</div>
                        {n < 5 && <div className="w-2 h-0.5 mx-0.5 rounded" style={{ backgroundColor: n < 2 ? primaryColor : '#e5e7eb' }} />}
                      </div>
                    ))}
                  </div>

                  {/* Step label */}
                  <div className="text-center">
                    <span className="text-[10px] font-semibold" style={{ color: primaryColor }}>Fecha y hora</span>
                  </div>

                  {/* Mock calendar */}
                  <div className="rounded-xl p-3" style={{ backgroundColor: cardBgColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold" style={{ color: textColor }}>Julio 2026</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['L','M','X','J','V','S','D'].map(d => (
                        <span key={d} className="text-[7px] font-medium" style={{ color: mutedColor }}>{d}</span>
                      ))}
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-md flex items-center justify-center"
                          style={{
                            backgroundColor: i === 9 ? primaryColor : 'transparent',
                            color: i === 9 ? '#fff' : textColor,
                            fontSize: '8px',
                          }}>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock service card */}
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBgColor }}>
                    <div className="h-16 w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)` }} />
                    <div className="p-3 space-y-2">
                      <p className="text-[11px] font-bold" style={{ color: textColor }}>Corte de pelo</p>
                      <p className="text-[9px]" style={{ color: mutedColor }}>30 min</p>
                      <p className="text-sm font-bold" style={{ color: primaryColor }}>$3.500</p>
                      <button className="w-full py-1.5 rounded-lg text-[9px] font-semibold text-white"
                        style={{ backgroundColor: primaryColor }}>Elegir</button>
                    </div>
                  </div>

                  {/* Mock form fields */}
                  <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: cardBgColor }}>
                    <div className="h-2.5 w-20 rounded" style={{ backgroundColor: `${textColor}22` }} />
                    <div className="h-6 w-full rounded-lg" style={{ backgroundColor: `${textColor}11`, border: `1px solid ${textColor}15` }} />
                    <div className="h-2.5 w-16 rounded mt-1" style={{ backgroundColor: `${textColor}22` }} />
                    <div className="h-6 w-full rounded-lg" style={{ backgroundColor: `${textColor}11`, border: `1px solid ${textColor}15` }} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 text-center" style={{ backgroundColor: cardBgColor }}>
                <p className="text-[8px]" style={{ color: mutedColor }}>Pagos seguros con Mercado Pago</p>
              </div>

              {/* Home indicator */}
              <div className="h-4 flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                <div className="w-20 h-1 rounded-full" style={{ backgroundColor: `${textColor}30` }} />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
