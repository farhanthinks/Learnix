import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in @napi-rs/canvas (native binary) and pdfjs-dist.
  // Bundling those into the server function breaks the native addon at
  // runtime ("corrupted or unreadable" for every PDF, not just bad ones) —
  // keep them external so they resolve via normal node_modules require.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "pdfjs-dist"],
  experimental: {
    serverActions: {
      // Next's CSRF check compares the request's Origin against
      // x-forwarded-host and rejects a mismatch. With VS Code's dev tunnel
      // port forwarding, the browser tab can show plain localhost:3000
      // (so Origin is "localhost:3000") while the tunnel's proxy still
      // sets x-forwarded-host to the tunnel domain — or the reverse, if
      // the tab is opened via the tunnel URL directly. Both origins need
      // to be allowed since either can show up depending on how the tab
      // was opened; the tunnel subdomain changes every session, so it's
      // wildcarded rather than pinned to one tunnel id.
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms"],
    },
  },
};

export default nextConfig;
