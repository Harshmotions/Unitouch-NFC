import type { Profile } from "@/types";

export function formatMemberSince(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 60) return `${Math.max(minutes, 1)} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const DEMO_PROFILES: Record<string, Profile> = {
  rohan: {
    id: "demo-rohan",
    username: "rohan",
    fullName: "Rohan Mehta",
    designation: "Creative Director",
    company: "Studio North",
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    email: "rohan@studionorth.in",
    website: "https://studionorth.in",
    instagram: "https://instagram.com/studionorth",
    linkedin: "https://linkedin.com/in/rohanmehta",
    location: "Mumbai, India",
    bio: "Building brand identities for ambitious founders. Let's make something people remember.",
    interests: ["🎨 Branding", "📐 Design", "💡 Strategy"],
    isPublished: true,
    profileStyle: "standard",
    createdAt: hoursAgo(21),
    updatedAt: hoursAgo(2),
  },
  priya: {
    id: "demo-priya",
    username: "priya",
    fullName: "Priya Anand",
    designation: "Portrait & Brand Photographer",
    whatsapp: "+91 91234 56789",
    email: "hello@priyaanand.com",
    website: "https://priyaanand.com",
    instagram: "https://instagram.com/priyaanand.photo",
    location: "Bengaluru, India",
    bio: "I help founders and creators look as good in photos as they sound in pitch meetings.",
    avatarUrl: "/profile-user.png",
    interests: ["📸 Photography", "✈️ Travel", "☕ Coffee"],
    isPublished: true,
    profileStyle: "personal",
    createdAt: hoursAgo(340),
    updatedAt: hoursAgo(5),
  },
};

export const DEMO_STATS: Record<string, { views: number; saves: number }> = {
  rohan: { views: 482, saves: 96 },
  priya: { views: 1204, saves: 211 },
};
