// Fill these with your Supabase project credentials
// IMPORTANT: Use the anon public key only and enable RLS on your table.
const SUPABASE_URL = "https://txywqmxcynvofslqdlck.supabase.co"; // provided project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXdxbXhjeW52b2ZzbHFkbGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzY3MjksImV4cCI6MjA2NTcxMjcyOX0.ONwEYLhtDwZffyNZTiSYy3ZX5lx1tBVpCQoODrqfrK8";

if (!window.supabase) {
  console.error("Supabase JS SDK not loaded. Make sure to include the CDN script before this file.");
}

// Create and expose the client globally
window.supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
