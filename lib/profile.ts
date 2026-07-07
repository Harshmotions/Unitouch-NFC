import type { Profile } from "@/types";
import { createPublicServerClient } from "@/lib/supabase/server";

/* Shape of a row exactly as Postgres returns it (snake_case). */
interface ProfileRow {
  id: string;
  username: string;
  full_name: string;
  designation: string | null;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  portfolio: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  extra_links: { label: string; url: string }[] | null;
  is_published: boolean;
  profile_style: "standard" | "personal";
  represents: "me" | "company" | "both" | null;
  created_at: string;
  updated_at: string;
  order_id: string | null;
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    designation: row.designation ?? undefined,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    linkedin: row.linkedin ?? undefined,
    twitter: row.twitter ?? undefined,
    youtube: row.youtube ?? undefined,
    portfolio: row.portfolio ?? undefined,
    location: row.location ?? undefined,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    interests: row.interests ?? undefined,
    extraLinks: row.extra_links ?? undefined,
    isPublished: row.is_published,
    profileStyle: row.profile_style,
    represents: row.represents ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    orderId: row.order_id ?? undefined,
  };
}

/* Public read of a published profile by username. RLS on the `profiles`
   table already restricts SELECT to is_published = true, so a missing or
   unpublished profile both resolve to null here — the caller can't tell
   them apart, which is intentional (don't leak which usernames exist). */
export async function getPublishedProfile(username: string): Promise<Profile | null> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;
  return mapProfileRow(data as ProfileRow);
}
