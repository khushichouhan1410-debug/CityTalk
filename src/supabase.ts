import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://mygdxzufiwrtniuhpyrr.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iJv-qKSxweVw3DityJQ2Og_NmGdxWQg';

// Create a single supabase client instance for the entire application
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // Explicitly point to the browser's native window.fetch to prevent any internal polyfills
    // from attempting to overwrite or redefine the global fetch property on window.
    fetch: window.fetch.bind(window)
  }
});
