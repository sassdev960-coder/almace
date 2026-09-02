import { createClient } from '@supabase/supabase-js';

// Supabase Configuration - Exactly as provided by user
export const SUPABASE_URL = 'https://cjcpsgfuqifyudtqvggo.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY3BzZ2Z1cWlmeXVkdHF2Z2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTYyNDEsImV4cCI6MjA5NDc5MjI0MX0.EoJeeiunzY0aisKLyBHalpYzSoXG4TEJeYEFBitAzgM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
