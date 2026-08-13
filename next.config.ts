import type { NextConfig } from "next";

// `HeroPrize`/`PrizeOfMonth` (change: prize-image, design.md §5) render
// `prize_image` — a public Supabase Storage URL — through `next/image`.
// `next/image` refuses any remote host that isn't explicitly allow-listed
// here; skipping this is the #1 easy-to-forget step (design.md "Open
// risks"): the image just silently 400s in the browser, no build error.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    // Next 16 added SSRF protection that blocks optimizing images from
    // hosts resolving to a private/loopback IP by default (E394) -- local
    // Supabase Storage on 127.0.0.1 is exactly that, so without this the
    // optimizer 400s even though remotePatterns matches.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Local Supabase Storage (`supabase start`, supabase/config.toml
      // `[api] port = 54321`) -- both hostnames browsers may resolve it as.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      // Remote Supabase project, derived from NEXT_PUBLIC_SUPABASE_URL so
      // this never needs a manual edit per environment/project.
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
