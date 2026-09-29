# Voculo deployment

Voculo currently keeps the existing `speechpocket.vercel.app` address until its custom domain is connected. Set `NEXT_PUBLIC_SITE_URL` to the current public address for canonical URLs, metadata, robots, and sitemaps.

## Required environment variable

- `DEEPGRAM_API_KEY` — server-side key used for speech processing. Do not expose it through a `NEXT_PUBLIC_*` variable.

## Optional environment variables

- `NEXT_PUBLIC_SITE_URL` — `https://speechpocket.vercel.app` until the Voculo domain is connected.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Search Console verification token.
- `SUPPORT_EMAIL` — monitored support address.
- `RATE_LIMIT_SALT` — optional secret used to hash request addresses for local or Cloudflare-backed counters.
- `EXA_API_KEY`, `NEWS_LLM_API_KEY`, `NEWS_LLM_BASE_URL`, `NEWS_LLM_MODEL` — only needed by the optional AI-notes generation workflow.

Audio transcription and analysis accept raw audio requests up to **4.5 MB**. Files pass through a Vercel Function to Deepgram; Voculo does not persist uploaded audio. The app does not use Vercel Blob, Upstash, or a cleanup cron. On Vercel, usage counters are short-lived and local to a function instance, so they are best-effort abuse controls rather than globally shared quotas.

## Release checks

1. Configure `DEEPGRAM_API_KEY` in Vercel Preview and Production.
2. Keep `NEXT_PUBLIC_SITE_URL=https://speechpocket.vercel.app` until the custom domain is connected.
3. Deploy a preview and verify the homepage, tool directory, legal pages, and representative tools on desktop and mobile.
4. Test one supported audio upload below 4.5 MB, one file above the limit, transcription, speech generation, an advanced analysis, and a live microphone session.
5. Confirm the preview has no console errors and that API failures show a useful message.
6. Promote the verified build to production. Connect the custom domain later, update `NEXT_PUBLIC_SITE_URL`, redeploy, and submit the new sitemap to Search Console.

No ad network is installed. Do not show empty ad slots before an ad provider is configured.
