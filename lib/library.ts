/** Libraries for the Vision board: photo moods, quotes, and colors.
 *  Nothing here is required — they are starting points, not prescriptions.
 */

/** Photo moods, phrased as Unsplash searches. Drawn from the brief's imagery
 *  direction (§7.5): coastal light, organic-modern calm, quiet luxury, composure,
 *  stillness, vitality, companionship, travel. Deliberately avoids visible logos,
 *  cash, jets, and wedding clichés. */
export const PHOTO_MOODS: { label: string; query: string }[] = [
  { label: "Coastal morning light", query: "coastal california morning light ocean calm" },
  { label: "A home that restores", query: "organic modern interior warm minimal light" },
  { label: "Quiet luxury", query: "neutral linen tailoring still life beige" },
  { label: "Composed and consequential", query: "elegant woman working calm office natural light" },
  { label: "Stillness and prayer", query: "quiet morning stillness candle open book" },
  { label: "Movement and vitality", query: "pilates yoga movement natural light woman" },
  { label: "Reciprocal companionship", query: "couple walking together warm candid" },
  { label: "Travel and beauty", query: "mediterranean travel olive trees warm stone" },
  { label: "Table and nourishment", query: "simple beautiful table setting fruit linen" },
  { label: "Water and breath", query: "swimming ocean water light serene" },
];

/** Quotes to choose from. Lines from her own Standard are unattributed because
 *  they are hers. Scripture is quoted with its reference. Nothing is attributed
 *  to a person unless the attribution is certain. */
export const QUOTE_LIBRARY: { text: string; source?: string; group: string }[] = [
  // From The Standard
  { text: "I pause before I perform.", group: "My Standard" },
  { text: "I feel before I explain.", group: "My Standard" },
  { text: "I receive before I reach.", group: "My Standard" },
  { text: "Consistency—not intensity—is the evidence I trust.", group: "My Standard" },
  { text: "Rest is part of my power.", group: "My Standard" },
  { text: "I can be ambitious without living in strain.", group: "My Standard" },
  { text: "I can be open without abandoning myself.", group: "My Standard" },
  { text: "I prepare, express, invite, and observe. I do not force.", group: "My Standard" },
  { text: "I build a life that does not revolve around being chosen.", group: "My Standard" },
  { text: "I never use my intelligence to argue against my own knowing.", group: "My Standard" },

  // Returning to yourself
  { text: "Return to yourself.", group: "Returning" },
  { text: "Pause before you perform.", group: "Returning" },
  { text: "Let the answer be simple.", group: "Returning" },
  { text: "You do not need to force clarity.", group: "Returning" },
  { text: "Begin again from where you are.", group: "Returning" },
  { text: "The first hour belongs to me.", group: "Returning" },
  { text: "Nothing needs to be forced today.", group: "Returning" },
  { text: "What is true for you right now?", group: "Returning" },

  // Receiving
  { text: "What are you available to receive?", group: "Receiving" },
  { text: "I am allowed to be met.", group: "Receiving" },
  { text: "Support is not a debt.", group: "Receiving" },
  { text: "I let it come to me.", group: "Receiving" },
  { text: "Peaceful, reciprocal, alive.", group: "Receiving" },

  // Faith
  { text: "Be still, and know that I am God.", source: "Psalm 46:10", group: "Faith" },
  { text: "In quietness and trust is your strength.", source: "Isaiah 30:15", group: "Faith" },
  { text: "Be still before the Lord and wait patiently for him.", source: "Psalm 37:7", group: "Faith" },
  { text: "Trust in the Lord with all your heart, and lean not on your own understanding.", source: "Proverbs 3:5", group: "Faith" },
  { text: "She is clothed with strength and dignity; she can laugh at the days to come.", source: "Proverbs 31:25", group: "Faith" },
  { text: "Guard your heart, for everything you do flows from it.", source: "Proverbs 4:23", group: "Faith" },
];

/** A palette to choose from, in the app's own register: warm neutrals first,
 *  then olive, coastal blue, and rose — used sparingly, as the brief asks. */
export const COLOR_LIBRARY: { name: string; hex: string }[] = [
  { name: "Warm ivory", hex: "#F7F3EC" },
  { name: "Paper", hex: "#FFFCF7" },
  { name: "Sand", hex: "#E8DED1" },
  { name: "Oat", hex: "#DCCFBD" },
  { name: "Travertine", hex: "#D6C7B4" },
  { name: "Soft taupe", hex: "#B7A696" },
  { name: "Driftwood", hex: "#9C8A78" },
  { name: "Aged gold", hex: "#B4935A" },
  { name: "Honey", hex: "#C9A46B" },
  { name: "Espresso", hex: "#332B27" },
  { name: "Warm charcoal", hex: "#4A403A" },
  { name: "Muted olive", hex: "#7D8168" },
  { name: "Eucalyptus", hex: "#96A088" },
  { name: "Deep olive", hex: "#626750" },
  { name: "Coastal blue", hex: "#718995" },
  { name: "Sea glass", hex: "#A9BDC0" },
  { name: "Morning sky", hex: "#C6D2D6" },
  { name: "Soft rose", hex: "#B88E84" },
  { name: "Blush", hex: "#D8BCB2" },
  { name: "Clay", hex: "#A87F6F" },
  { name: "Terracotta", hex: "#9C6B55" },
  { name: "Sage mist", hex: "#C3C9B8" },
  { name: "Fog", hex: "#CFC7BE" },
  { name: "Ink olive", hex: "#4C503F" },
];

export interface UnsplashPhoto {
  id: string;
  thumb: string;
  full: string;
  alt: string;
  credit: string;
  creditUrl: string;
  downloadLocation: string;
}

const KEY_STORAGE = "unsplashKey";

export function unsplashKey(): string {
  return (
    localStorage.getItem(KEY_STORAGE) ||
    (import.meta.env.VITE_UNSPLASH_KEY as string | undefined) ||
    ""
  );
}

export function setUnsplashKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export async function searchPhotos(query: string, page = 1): Promise<UnsplashPhoto[]> {
  const key = unsplashKey();
  if (!key) throw new Error("no-key");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24&page=${page}&orientation=landscape&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
  if (!res.ok) throw new Error(res.status === 401 ? "bad-key" : "request-failed");
  const json = (await res.json()) as {
    results: {
      id: string; alt_description: string | null;
      urls: { small: string; regular: string };
      user: { name: string; links: { html: string } };
      links: { download_location: string };
    }[];
  };
  return json.results.map((p) => ({
    id: p.id,
    thumb: p.urls.small,
    full: p.urls.regular,
    alt: p.alt_description ?? "",
    credit: p.user.name,
    creditUrl: p.user.links.html,
    downloadLocation: p.links.download_location,
  }));
}

/** Unsplash asks that a use be registered at the download endpoint. Fire and forget. */
export function registerDownload(photo: UnsplashPhoto): void {
  const key = unsplashKey();
  if (!key) return;
  void fetch(photo.downloadLocation, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
}
