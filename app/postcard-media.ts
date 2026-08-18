export type PostcardAttachment = {
  kind: "photo" | "gif";
  src: string;
  label: string;
};

export type PostcardSticker = {
  symbol: string;
  label: string;
};

export type PostcardMessage = {
  id?: number;
  name: string;
  role: string;
  text: string;
  stamp: string;
  media: PostcardAttachment[];
  stickers: PostcardSticker[];
};

export const MAX_POSTCARD_MEDIA = 2;
export const MAX_POSTCARD_STICKERS = 4;

export const POSTCARD_EMOJIS = [
  "✨", "🎉", "😊", "👏", "🇫🇷", "☕", "🥐", "🗼", "🧳", "✈️",
  "🌟", "🙌", "🤝", "🚀", "📸", "🎈", "🗺️", "🌻", "🍰", "🥂",
] as const;

export const POSTCARD_STICKERS: readonly PostcardSticker[] = [
  { symbol: "🗼", label: "Eiffel Tower" },
  { symbol: "🥐", label: "Parisian croissant" },
  { symbol: "☕", label: "Café stop" },
  { symbol: "🇫🇷", label: "Bonjour, France" },
  { symbol: "✈️", label: "Bon voyage" },
  { symbol: "🧳", label: "New adventures" },
  { symbol: "🌻", label: "Sunflower" },
  { symbol: "🥂", label: "Cheers" },
  { symbol: "🚲", label: "Paris by bicycle" },
  { symbol: "🎨", label: "An artistic detour" },
  { symbol: "📮", label: "Special delivery" },
  { symbol: "✨", label: "A little magic" },
];

export function normalizePostcardStamp(stamp: string | null | undefined): string {
  const trimmed = stamp?.trim();
  return !trimmed || trimmed.toUpperCase() === "WITH LOVE" ? "BEST WISHES" : trimmed;
}

export function isTrustedPostcardMediaUrl(src: string): boolean {
  if (/^\/api\/media\/postcards\/[a-f\d-]{36}\.(?:jpg|jpeg|png|webp|gif|avif)$/i.test(src)) return true;

  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    return /^(?:media\d*|i)\.giphy\.com$/i.test(url.hostname) || url.hostname.toLowerCase() === "media.tenor.com";
  } catch {
    return false;
  }
}

export function normalizeGifUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;

    if (["giphy.com", "www.giphy.com"].includes(url.hostname.toLowerCase())) {
      const slug = url.pathname.split("/").filter(Boolean).at(-1);
      const id = slug?.split("-").at(-1);
      return id && /^[a-z\d]+$/i.test(id) ? `https://media.giphy.com/media/${id}/giphy.gif` : null;
    }

    return isTrustedPostcardMediaUrl(url.toString()) ? url.toString() : null;
  } catch {
    return null;
  }
}
