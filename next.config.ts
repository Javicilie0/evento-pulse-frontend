import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.railway.app' },
      { protocol: 'https', hostname: '**.t3.storageapi.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 3600,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/css/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/img/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/js/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  async redirects() {
    return [
      { source: '/Home/Privacy', destination: '/privacy', permanent: false },
      { source: '/Posts/Index', destination: '/flow', permanent: false },
      { source: '/Posts/Create', destination: '/flow/new', permanent: false },
      { source: '/Posts/Details/:id', destination: '/posts/:id', permanent: false },
      { source: '/Posts/Edit/:id', destination: '/posts/:id/edit', permanent: false },
      { source: '/Posts/Delete/:id', destination: '/posts/:id/delete', permanent: false },
      { source: '/Messages/Index', destination: '/inbox', permanent: false },
      { source: '/Messages/Details/:token', destination: '/inbox/:token', permanent: false },
      { source: '/Tickets/MyTickets', destination: '/tickets', permanent: false },
      { source: '/Tickets/Validate', destination: '/tickets/validate', permanent: false },
      { source: '/Tickets/Manage/:eventId', destination: '/tickets/manage/:eventId', permanent: false },
      { source: '/Tickets/Create/:eventId', destination: '/tickets/create/:eventId', permanent: false },
      { source: '/Tickets/Edit/:id', destination: '/tickets/edit/:id', permanent: false },
      { source: '/Tickets/Details/:id', destination: '/tickets/:id', permanent: false },
      { source: '/Tickets/Delete/:id', destination: '/tickets/:id/delete', permanent: false },
      { source: '/Events/Create', destination: '/events/new', permanent: false },
      { source: '/Events/Recommended', destination: '/events/recommended', permanent: false },
      { source: '/Events/Details/:id', destination: '/events/:id', permanent: false },
      { source: '/Events/Edit/:id', destination: '/events/:id/edit', permanent: false },
      { source: '/Events/Delete/:id', destination: '/events/:id/delete', permanent: false },
      { source: '/Search/Index', destination: '/search', permanent: false },
      { source: '/Preferences/Index', destination: '/preferences', permanent: false },
      { source: '/Preferences/Edit', destination: '/preferences', permanent: false },
      { source: '/Layouts/Index', destination: '/layouts', permanent: false },
      { source: '/Layouts/Edit/:id', destination: '/layouts/editor?id=:id', permanent: false },
      { source: '/Account/Index', destination: '/account', permanent: false },
      { source: '/Account/EditProfile', destination: '/account/edit', permanent: false },
      { source: '/Account/Apply', destination: '/account/apply', permanent: false },
      { source: '/Account/EditApplication', destination: '/account/edit-application', permanent: false },
      { source: '/Profiles/Details/:id', destination: '/profile/:id', permanent: false },
      { source: '/Profiles/Followers/:id', destination: '/profile/:id/followers', permanent: false },
      { source: '/Profiles/Following/:id', destination: '/profile/:id/following', permanent: false },
      { source: '/Organizer/Dashboard', destination: '/organizer/dashboard', permanent: false },
      { source: '/Organizer/Events', destination: '/organizer/events', permanent: false },
      { source: '/Organizer/Validators', destination: '/organizer/validators', permanent: false },
      { source: '/Organizer/Profiles', destination: '/organizer/profiles', permanent: false },
      { source: '/Organizer/Profile/:id', destination: '/organizer/profiles/edit/:id', permanent: false },
      { source: '/Organizer/Workspaces', destination: '/organizer/workspaces', permanent: false },
      { source: '/Organizer/Workspace/:id', destination: '/organizer/workspaces/edit/:id', permanent: false },
      { source: '/Admin/Index', destination: '/admin', permanent: false },
      { source: '/Admin/Events', destination: '/admin/events', permanent: false },
      { source: '/Admin/EventChange/:id', destination: '/admin/event-changes?id=:id', permanent: false },
      { source: '/Admin/Organizers', destination: '/admin/organizers', permanent: false },
      { source: '/Admin/Posts', destination: '/admin/posts', permanent: false },
      { source: '/Admin/Tickets', destination: '/admin/tickets', permanent: false },
      { source: '/Admin/Transactions', destination: '/admin/transactions', permanent: false },
      { source: '/Admin/Users', destination: '/admin/users', permanent: false },
    ]
  },

  experimental: {
    optimizePackageImports: ['@microsoft/signalr', 'date-fns', 'axios'],
  },

  compress: true,
}

export default nextConfig
