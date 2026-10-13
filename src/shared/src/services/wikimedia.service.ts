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

// Characters MediaWiki never allows in a page title (regardless of language
// or script): # < > [ ] | { } and raw control characters. OSM contributors
// occasionally paste wiki markup (e.g. "[[File:Name.jpg]]") or a full browser
// URL including its "#/media/..." fragment straight into the tag value
// instead of a clean filename. Sending that through unchanged makes the
// MediaWiki API reject the whole request with "invalidtitle" instead of just
// not finding a photo, which is worse: it errors instead of degrading.
const INVALID_TITLE_CHARS = /[#<>[\]|{}\x00-\x1f\x7f]/;

function sanitizeTitle(raw: string): string | null {
  let cleaned = raw.trim();

  // Strip "[[...]]" wiki-link markup if someone pasted the full wikitext.
  cleaned = cleaned.replace(/^\[\[\s*/, '').replace(/\s*\]\]$/, '');

  // Drop a trailing "#..." fragment (e.g. copied from a Commons page URL).
  cleaned = cleaned.split('#')[0].trim();

  if (!cleaned) return null;

  // Anything else MediaWiki would still reject: bail out rather than send a
  // request we know will error.
  if (INVALID_TITLE_CHARS.test(cleaned)) return null;

  return cleaned;
}

// OSM tag values are sometimes percent-encoded (e.g. "Schiebet%C3%BCre.jpg"
// instead of "Schiebetüre.jpg"), which the MediaWiki API rejects as an invalid
// title. A literal "%" that isn't part of an escape sequence makes
// decodeURIComponent throw, in which case the value is kept as-is.
function decodeTitle(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractFilename(tag: string): string | null {
  const normalized = sanitizeTitle(tag);
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      if (url.hostname.toLowerCase() !== 'commons.wikimedia.org') return null;
      const wikiMatch = url.pathname.match(/^\/wiki\/(File:[^#?]+)/i);
      if (wikiMatch) return sanitizeTitle(decodeTitle(wikiMatch[1]));
      return null;
    } catch {
      return null;
    }
  }

  if (/^file:/i.test(normalized)) return sanitizeTitle(decodeTitle(normalized));
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(normalized)) {
    const title = sanitizeTitle(decodeTitle(normalized));
    return title ? `File:${title}` : null;
  }
  return null;
}

async function queryWikimediaPage(
  filename: string,
  signal?: AbortSignal
): Promise<WikimediaPage | null> {
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
  return page;
}

function toPhoto(page: WikimediaPage, filename: string): WikimediaPhoto | null {
  const info = page.imageinfo?.[0];
  if (!info?.thumburl) return null;

  return {
    thumbUrl: info.thumburl,
    descriptionUrl:
      info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(filename)}`,
  };
}

export const fetchWikimediaPhoto = async (
  wikimediaCommons?: string,
  image?: string,
  signal?: AbortSignal
): Promise<WikimediaPhoto | null> => {
  const filename = extractFilename(wikimediaCommons ?? image ?? '');
  if (!filename) return null;

  try {
    const page = await queryWikimediaPage(filename, signal);
    return page ? toPhoto(page, filename) : null;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn('Wikimedia photo request canceled.');
    } else {
      console.error(error);
    }
    return null;
  }
};
