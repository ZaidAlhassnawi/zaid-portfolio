import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_CONFIG } from "./config.js";

const hasValidConfiguration =
  SUPABASE_CONFIG.url.startsWith("https://") &&
  !SUPABASE_CONFIG.url.includes("PASTE_") &&
  SUPABASE_CONFIG.publishableKey.length > 20 &&
  !SUPABASE_CONFIG.publishableKey.includes("PASTE_");

export const configurationReady = hasValidConfiguration;

export const supabase = hasValidConfiguration
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getPublicAssetUrl(path) {
  if (!path || !supabase) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from(SUPABASE_CONFIG.storageBucket).getPublicUrl(path).data.publicUrl;
}
