export interface GalleryImage {
  url: string;
  title: string;
  description: string;
}

export function normalizeImages(imgs: unknown[]): GalleryImage[] {
  return imgs.map(img =>
    typeof img === 'string' ? { url: img, title: '', description: '' } : img
  ) as GalleryImage[];
}

// El negocio pega en "Scripts personalizados" (SEO/Marketing) el snippet que
// le da un proveedor de tracking — normalmente un <script>...</script>. Antes
// esto se insertaba con wrapper.innerHTML = html, lo que en realidad NO
// ejecuta los <script> (el navegador los ignora al insertarlos asi), pero SI
// ejecuta atributos tipo <img src=x onerror="..."> — el peor de los dos
// mundos: los scripts legitimos no corrian, y quedaba una puerta abierta para
// inyectar JS via atributos on* en el propio panel del negocio.
//
// Esta funcion parsea el HTML pegado, ignora CUALQUIER etiqueta que no sea
// <script> (nada de onerror/onload/etc via otras etiquetas), y recrea cada
// <script> encontrado con document.createElement — asi el navegador SI lo
// ejecuta. Devuelve los elementos insertados para poder limpiarlos al
// desmontar.
export function injectScriptsFromHtml(html: string, container: Element): HTMLScriptElement[] {
  const inserted: HTMLScriptElement[] = [];
  let scripts: NodeListOf<HTMLScriptElement>;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    scripts = doc.querySelectorAll('script');
  } catch {
    return inserted;
  }

  scripts.forEach(original => {
    const el = document.createElement('script');
    const src = original.getAttribute('src');
    if (src) {
      // Solo protocolos de red reales — nada de javascript:/data: en src.
      if (/^https?:\/\//i.test(src)) el.src = src;
      else return;
      if (original.async) el.async = true;
      if (original.defer) el.defer = true;
    } else if (original.textContent) {
      el.text = original.textContent;
    } else {
      return;
    }
    container.appendChild(el);
    inserted.push(el);
  });

  return inserted;
}
