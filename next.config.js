const withNextIntl = require('next-intl/plugin')(
  // This is the default (also the `src` folder is supported out of the box)
  './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip static optimization for pages that use useSession()
  // These pages must be rendered at runtime
  skipMiddlewareUrlNormalize: false,
  skipTrailingSlashRedirect: false,
  async headers() {
    return [
      {
        // Allow embedding in iframes for /embed routes
        source: '/embed/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // In production, restrict to specific domains
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow iframe embedding
          },
        ],
      },
    ];
  },
}

module.exports = withNextIntl(nextConfig);