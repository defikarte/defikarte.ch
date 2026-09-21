import axios from 'axios';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

interface WikimediaImageInfo {
  thumburl?: string;
  descriptionurl?: string;
  url?: string;
}

interface WikimediaPage {
  missing?: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaApiResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

export interface WikimediaPhoto {
  thumbUrl: string;
  descriptionUrl: string;
}

function extractFilename(tag: string): string | null {
  const normalized = tag.trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      if (url.hostname.toLowerCase() !== 'commons.wikimedia.org') return null;
      const wikiMatch = url.pathname.match(/^\/wiki\/(File:[^#?]+)/i);
      if (wikiMatch) return decodeURIComponent(wikiMatch[1]);
      return null;
    } catch {
      return null;
    }
  }

  if (/^file:/i.test(normalized)) return normalized;
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(normalized)) return `File:${normalized}`;
  return null;
}

export const fetchWikimediaPhoto = async (
  wikimediaCommons?: string,
  image?: string,
  signal?: AbortSignal
): Promise<WikimediaPhoto | null> => {
  const filename = extractFilename(wikimediaCommons ?? image ?? '');
  if (!filename) return null;

  try {
    const response = await axios.get<WikimediaApiResponse>(COMMONS_API, {
      params: {
        action: 'query',
        titles: filename,
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: '400',
        format: 'json',
        origin: '*',
      },
      signal,
    });

    const pages = response.data?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) return null;

    const info = page.imageinfo?.[0];
    if (!info?.thumburl) return null;

    return {
      thumbUrl: info.thumburl,
      descriptionUrl:
        info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(filename)}`,
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn('Wikimedia photo request canceled.');
    } else {
      console.error(error);
    }
    return null;
  }
};
