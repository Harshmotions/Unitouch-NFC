import type { Profile } from "@/types";
import { createPublicServerClient, createServiceRoleClient } from "@/lib/supabase/server";

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

/* Loads a profile the given user owns, published or not — for the digital
   studio, where the row is still an unpublished placeholder. Uses the
   service-role client (RLS would hide unpublished rows). Pass a username to
   target a specific profile, otherwise returns the user's most recent one. */
export async function getEditableProfile(userId: string, username?: string): Promise<Profile | null> {
  const supabase = createServiceRoleClient();
  let query = supabase.from("profiles").select("*").eq("user_id", userId);
  if (username) query = query.eq("username", username.trim().toLowerCase());
  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error || !data) return null;
  return mapProfileRow(data as ProfileRow);
}

/* Loads any profile by id, published or not, regardless of owner — for the
   admin dashboard. requireAdmin() already gated the page before this runs;
   there's no additional ownership check here by design. */
export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;
  return mapProfileRow(data as ProfileRow);
}

export interface AdminProfileSummary {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  isPublished: boolean;
  studioCompleted: boolean;
  createdAt: string;
}

/* Every profile, newest first — for the admin profiles list. */
export async function listProfilesForAdmin(): Promise<AdminProfileSummary[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, is_published, studio_completed, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    isPublished: row.is_published,
    studioCompleted: row.studio_completed,
    createdAt: row.created_at,
  }));
}
