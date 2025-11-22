import { createClient } from '@supabase/supabase-js';

// Konfigurasi Database Supabase
const supabaseUrl = 'https://lkurnjlvycfsgmovkulf.supabase.co'; 
const supabaseKey = 'sb_publishable_pR5tW3S5nTIitc3wXfwNzw_VPH1aKYO';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper untuk mendapatkan URL gambar
// Updated: Supports optional bucket name (default: 'banners')
export const getStorageUrl = (path: string, bucket = 'banners') => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
};

// Helper safe extraction untuk error message
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Handle standard Error objects
  if (error instanceof Error) {
      if (error.message === '[object Object]') return 'An unexpected error occurred (Invalid Error Message)';
      return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
      if (error === '[object Object]') return 'Unknown error (Invalid String)';
      return error;
  }
  
  // Handle object errors
  if (typeof error === 'object') {
      // Cek properti error nested (common in some API responses)
      if (error.error && typeof error.error === 'object') {
          return getErrorMessage(error.error);
      }

      // Cek properti spesifik error Supabase / Postgrest
      if ('message' in error) {
          // Ensure message is not an object itself
          if (typeof error.message === 'object') {
              return JSON.stringify(error.message);
          }
          
          let msg = String(error.message);
          if ('details' in error && error.details) msg += ` (${error.details})`;
          if ('hint' in error && error.hint) msg += ` Hint: ${error.hint}`;
          
          // Final guard against [object Object] in message
          if (msg === '[object Object]') return 'Database error (Details unavailable)';
          
          return msg;
      }
      if ('error_description' in error) return String(error.error_description);
      if ('msg' in error) return String(error.msg);
      
      // Fallback ke JSON stringify jika error object generik, hindari [object Object]
      try {
          const json = JSON.stringify(error);
          if (json === '{}' || json === '[]') {
              // Attempt to get a better string representation if JSON is empty (e.g. DOM Exception)
              const str = String(error);
              if (str === '[object Object]') {
                  // Try to inspect keys if native string fails
                  const keys = Object.keys(error);
                  if (keys.length > 0) return `Error Keys: ${keys.join(', ')}`;
                  return 'An unexpected error occurred (Empty Object)';
              }
              return str;
          }
          return json;
      } catch {
          return 'Unknown error object (Circular structure?)';
      }
  }
  
  return String(error);
};