import { createClient } from '@supabase/supabase-js';

const inferredUrlFromDbHost = 'https://qpraaostmojllbgfczox.supabase.co';
const configuredUrl = import.meta.env.VITE_SUPABASE_URL || inferredUrlFromDbHost;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase no configurado: usando fallback local (constants/localStorage).');
}

export const supabase = isSupabaseConfigured
  ? createClient(configuredUrl, configuredAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
