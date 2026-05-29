// Base URL for map images.
// - Local dev: unset → served from Vite's public dir at /maps
// - Production: set VITE_MAPS_BASE_URL to the Supabase Storage public URL
//   (<SUPABASE_URL>/storage/v1/object/public/maps) so gitignored assets load.
const BASE = (import.meta.env.VITE_MAPS_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/maps';

export const mapUrl = (file: string) => `${BASE}/${file}`;
