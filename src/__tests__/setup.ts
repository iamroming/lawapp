// Set required env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.CSRF_SECRET = "test-csrf-secret-for-testing-only";
process.env.CRON_SECRET = "test-cron-secret";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.APP_URL = "http://localhost:3000";
