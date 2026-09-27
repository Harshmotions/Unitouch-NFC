import { NextResponse } from "next/server";

/* TEMPORARY debug endpoint — reports which server env vars are present at
   runtime (booleans + lengths only, never the values). Used to diagnose the
   production Razorpay env. DELETE THIS ROUTE after diagnosis. */
export async function GET() {
  const len = (v: string | undefined) => (v ?? "").length;
  return NextResponse.json({
    present: {
      // new RZP_ names (what we're moving to)
      RZP_KEY_ID: !!process.env.RZP_KEY_ID,
      RZP_KEY_SECRET: !!process.env.RZP_KEY_SECRET,
      RZP_WEBHOOK_SECRET: !!process.env.RZP_WEBHOOK_SECRET,
      // old RAZORPAY_ names (the ones that wouldn't deliver to prod)
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    // lengths catch "present but empty" and stray whitespace (values NOT shown)
    length: {
      RZP_KEY_ID: len(process.env.RZP_KEY_ID),
      RZP_KEY_SECRET: len(process.env.RZP_KEY_SECRET),
      RZP_WEBHOOK_SECRET: len(process.env.RZP_WEBHOOK_SECRET),
    },
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
