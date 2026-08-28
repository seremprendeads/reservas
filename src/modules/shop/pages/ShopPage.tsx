function ShopMarketingPopup() {
  const shopConfig = useShopConfig();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const config = shopConfig?.popup;
    if (!config?.enabled || sessionStorage.getItem('shop_popup_dismissed')) return;

    const checkScroll = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (pct > 30) {
        setVisible(true);
        window.removeEventListener('scroll', checkScroll);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [shopConfig]);

  const config = shopConfig?.popup;
  const close = () => {
    setVisible(false);
    sessionStorage.setItem('shop_popup_dismissed', '1');
  };

  if (!config?.enabled || !visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col"
        style={{ backgroundColor: config.overlay_color || '#111827' }}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-[10000] flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white transition-all hover:bg-black/50"
        >
          <X className="h-4 w-4" />
        </button>

        {(config.title || config.subtitle || config.description) && (
          <div className="px-6 pt-8 pb-4 text-center">
            {config.title && (
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                {config.title}
              </h3>
            )}
            {config.subtitle && (
              <p className="text-sm sm:text-base text-white/85" style={{ fontFamily: "'Inter', sans-serif" }}>
                {config.subtitle}
              </p>
            )}
            {config.description && (
              <p className="text-xs text-white/70 leading-relaxed mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                {config.description}
              </p>
            )}
          </div>
        )}

        {config.image_url && (
          <div className="w-full">
            <img src={config.image_url} alt="" className="w-full object-cover" />
          </div>
        )}

       {config.button_text && (
          <div className="px-6 py-5 text-center">
            
              href={config.button_url || '#'}
              onClick={close}
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: '#059669' }}
            >
              {config.button_text}
            </a>
          </div>
        )}
      </div>
    </div>
  );