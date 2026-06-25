/* One-off seed script — run with: node scripts/seed-profiles.js
   Reads Supabase creds straight out of .env.local (no dotenv dependency)
   and upserts the two live demo profiles. Safe to re-run: it upserts by
   username, so re-running just refreshes the same two rows. */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString();

const PROFILES = [
  {
    username: "rohan",
    full_name: "Rohan Mehta",
    designation: "Creative Director",
    company: "Studio North",
    phone: "+919834819014",
    whatsapp: "+919834819014",
    email: "harshuvideocc@gmail.com",
    website: "https://motionbyharsh.com",
    instagram: "https://www.instagram.com/motionby.harsh/",
    linkedin: "https://www.linkedin.com/in/harsh-powar/",
    location: "Mumbai, India",
    bio: "Building brand identities for ambitious founders. Let's make something people remember.",
    interests: ["🎨 Branding", "📐 Design", "💡 Strategy"],
    is_published: true,
    profile_style: "standard",
    created_at: hoursAgo(21),
  },
  {
    username: "priya",
    full_name: "Priya Anand",
    designation: "Portrait & Brand Photographer",
    whatsapp: "+91 91234 56789",
    email: "hello@priyaanand.com",
    website: "https://priyaanand.com",
    instagram: "https://instagram.com/priyaanand.photo",
    location: "Bengaluru, India",
    bio: "I help founders and creators look as good in photos as they sound in pitch meetings.",
    avatar_url: "/profile-user.png",
    interests: ["📸 Photography", "✈️ Travel", "☕ Coffee"],
    is_published: true,
    profile_style: "personal",
    created_at: hoursAgo(340),
  },
];

async function main() {
  for (const profile of PROFILES) {
    const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "username" });
    if (error) {
      console.error(`Failed to seed "${profile.username}":`, error.message);
      process.exitCode = 1;
    } else {
      console.log(`Seeded profile "${profile.username}"`);
    }
  }
}

main();
