export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  const origin = getRequestURL(event).origin
  const config = useRuntimeConfig(event)

  const paths = new Set<string>(['/', '/legal/terms', '/legal/privacy'])

  // Public student profiles are indexable — add them to the sitemap.
  try {
    const res = await $fetch<{ data?: { users?: { id: string }[] } }>(
      `${config.public.apiUrl}/graphql`,
      {
        method: 'POST',
        body: { query: 'query{ users(accountType:"student", limit:200){ id } }' },
        ignoreResponseError: true,
      },
    )
    for (const u of res?.data?.users ?? []) paths.add(`/talent/${u.id}`)
  } catch {
    // Cold gateway — serve the static pages only.
  }

  const urls = [...paths]
    .map((p) => `  <url><loc>${origin}${p}</loc></url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
})
