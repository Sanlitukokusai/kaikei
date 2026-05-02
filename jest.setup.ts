import "@testing-library/jest-dom";

// Provide fake Supabase env vars so the guard in supabase.ts doesn't throw during tests.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
