import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daamiurywpbcfzbxnbfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYW1pdXJ5d3BiY2Z6YnhuYmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTMzNTQsImV4cCI6MjA2NjI2OTM1NH0.5uq2mggeoqrPZvv6r8J0vBVBGW2LgtD1EzLKEJa3Yjw';



export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  