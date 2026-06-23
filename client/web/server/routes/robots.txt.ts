export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  const origin = getRequestURL(event).origin

  const disallow = [
    '/dashboard',
    '/settings',
    '/chat',
    '/payments',
    '/projects',
    '/skill-tests',
    '/portfolio',
    '/notifications',
    '/verification',
    '/profile',
    '/disputes',
    '/onboarding',
    '/login',
    '/verify',
    '/api/',
  ]

  return [
    'User-agent: *',
    'Allow: /$',
    'Allow: /talent/',
    'Allow: /legal/',
    ...disallow.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
})
