import { NextResponse } from "next/server";

/* TEMPORARY debug endpoint — reports which server env vars are present at
   runtime (booleans + lengths only, never the values). Used to diagnose the
   production Razorpay env. DELETE THIS ROUTE after diagnosis. */
export async function GET() {
  const len = (v: string | undefined) => (v ?? "").length;
  return NextResponse.json({
    present: {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      RAZORPAY_WEBHOOK_SECRET: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    // lengths catch "present but empty" and stray whitespace (values NOT shown)
    length: {
      RAZORPAY_KEY_ID: len(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET: len(process.env.RAZORPAY_KEY_SECRET),
      RAZORPAY_WEBHOOK_SECRET: len(process.env.RAZORPAY_WEBHOOK_SECRET),
      SUPABASE_SERVICE_ROLE_KEY: len(process.env.SUPABASE_SERVICE_ROLE_KEY),
      UPSTASH_REDIS_REST_URL: len(process.env.UPSTASH_REDIS_REST_URL),
    },
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
