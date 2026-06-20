// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@pinia/nuxt'],

  // Order matters: base Fusion UI styles first, then the brand skin overrides.
  css: ['@rukkiecodes/vue/styles', '~/assets/css/brand.css'],

  app: {
    head: {
      title: 'QueenSkiilia — Verified talent, real projects',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Hire verified student talent or get paid for real work. Skill-tested, escrow-protected, dispute-backed.',
        },
        { property: 'og:site_name', content: 'QueenSkiilia' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'theme-color', content: '#0066cc' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Private — server-only (never exposed to the client bundle)
    internalSecret: '', // NUXT_INTERNAL_SECRET

    public: {
      // GraphQL gateway + auth BFF target
      apiUrl: 'https://queenskilla-mainserver.vercel.app', // NUXT_PUBLIC_API_URL
      // Cloudinary unsigned upload
      cloudinaryCloudName: '', // NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      cloudinaryUploadPreset: '', // NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      // Paystack (public key only — secret stays server-side in paystack-service)
      paystackPublicKey: '', // NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    },
  },
})
