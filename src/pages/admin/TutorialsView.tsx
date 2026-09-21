import { PlayCircle, Youtube } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

// ============================================================================
// Video destacado + canal de YouTube con los tutoriales de la app.
//
// Para activar el video: pegar el ID de YouTube en FEATURED_VIDEO_ID (es la
// parte final de la URL, ej. en youtube.com/watch?v=XXXXXXXXXXX el ID es
// "XXXXXXXXXXX"). Mientras esté vacío se muestra un cartel de "Video
// próximamente" en vez de un reproductor roto.
// Para el botón "Suscribite al canal": pegar la URL del canal en YOUTUBE_CHANNEL_URL.
// ============================================================================
const FEATURED_VIDEO_ID = '';
const YOUTUBE_CHANNEL_URL = '';

export function TutorialsView() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          Tutoriales
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aprendé a sacarle el máximo provecho a tu cuenta de BioWebLink.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {FEATURED_VIDEO_ID ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${FEATURED_VIDEO_ID}`}
                title="Tutorial de BioWebLink"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-muted/40 text-center p-8">
              <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">Video próximamente</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Estamos preparando el primer tutorial. Mientras tanto, suscribite al canal para enterarte apenas salga.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {YOUTUBE_CHANNEL_URL && (
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700"
        >
          <Youtube className="h-4 w-4" />
          Suscribite a nuestro canal de YouTube
        </a>
      )}
    </div>
  );
}
