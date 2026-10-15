const secure = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];
module.exports = {
  typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true }, // as in the original project; run `npx tsc --noEmit` to check types
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: secure },
      // signed-in pages and every API response: never cached by browsers or proxies
      { source: "/(patient|admin|api)/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
};
