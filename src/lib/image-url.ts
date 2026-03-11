/**
 * Convert data URIs stored in the DB to lightweight API URLs
 * so HTML pages don't bloat with inline base64.
 */
export function portraitImageUrl(agentId: string, portraitUrl: string | null): string | null {
  if (!portraitUrl) return null;
  if (portraitUrl.startsWith("data:")) return `/api/agents/${agentId}/portrait-image`;
  return portraitUrl;
}

export function comicImageUrl(episodeId: string, comicUrl: string | null): string | null {
  if (!comicUrl) return null;
  if (comicUrl.startsWith("data:")) return `/api/episodes/${episodeId}/comic-image`;
  return comicUrl;
}
