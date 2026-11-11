// Fill these in once, then everything else on the site picks them up.
window.MOONFIELD = {
  // WhatsApp number in international format, digits only (e.g. 919876543210)
  whatsappNumber: "919313118039",
  // Shown in the contact section and in the structured data
  email: "meenakshi64730@gmail.com",
  // URL of your deployed Cloudflare Worker for the Moon chatbot (see worker/README.md).
  // Leave empty and Moon answers from built-in canned replies instead of Grok.
  moonApi: "https://moon.meenakshi64730.workers.dev/", // LOCAL TEST ONLY - replace with the deployed worker URL
  // Supabase project (Settings > API). The anon key is meant to be public;
  // the table's Row Level Security only allows inserts (see supabase/schema.sql).
  supabaseUrl: "https://ikyhnwaaccnhwlyyddje.supabase.co/rest/v1/",
  supabaseAnonKey: "sb_publishable_bYx5Si4Enqb64giPbbLjYw_vmBdEykd",
  // Cloudflare Web Analytics token (Analytics & Logs > Web Analytics > Add site)
  cfAnalyticsToken: ""
};
