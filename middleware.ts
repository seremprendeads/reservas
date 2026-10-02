// Routing Middleware de Vercel. Corre ANTES del filesystem y del cache, asi que
// es la unica forma de interceptar "/": el rewrite de vercel.json no alcanza
// porque Vercel sirve dist/index.html desde el filesystem antes de aplicar
// rewrites. El matcher limita esto SOLO a la raiz; el resto de rutas (incluido
// /:slug) las sigue resolviendo vercel.json.
import { rewrite } from '@vercel/functions';

export const config = { matcher: ['/'] };

export default function middleware(request: Request) {
  return rewrite(new URL('/api/seo?slug=bioweblink&path=/', request.url));
}