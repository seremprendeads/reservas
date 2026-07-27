export function extractVideoEmbedUrl(url: string): string | null {
  if (!url) return null;

  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }

  const vimeoPatterns = [
    /(?:vimeo\.com\/)(\d+)/,
    /(?:player\.vimeo\.com\/video\/)(\d+)/,
  ];
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }

  return null;
}

export function isValidVideoUrl(url: string): boolean {
  return extractVideoEmbedUrl(url) !== null;
}
