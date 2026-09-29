# Voculo pre-launch setup

The app code is ready for a Vercel preview, but the production integrations below must be connected before audio processing and public launch will work.

## Required Vercel environment variables

Set these for the Preview and Production environments in the Vercel project:

- `DEEPGRAM_API_KEY` — a rotated server-side Deepgram key. Never add it to a `NEXT_PUBLIC_*` variable.
- `BLOB_READ_WRITE_TOKEN` — from a Vercel Blob store. Uploads use unlisted temporary Blob URLs, are sent to Deepgram, and are deleted after processing.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — shared counters for Vercel rate limits. The app fails closed if these are missing.
- `RATE_LIMIT_SALT` — a random secret used to hash request addresses; use a different value from every provider token.
- `CRON_SECRET` — a long random secret protecting the daily abandoned-upload cleanup route.
- `NEXT_PUBLIC_SITE_URL=https://speechpocket.vercel.app` — keep this until the Voculo custom domain is attached in Vercel.
- `SUPPORT_EMAIL` — an inbox that is actually monitored.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — optional Search Console HTML verification token after adding the domain property.

The `.env.example` file contains the variable names. Do not commit real credentials.

## Vercel project steps

1. Keep using `https://speechpocket.vercel.app` for now. Later, attach the Voculo custom domain to the intended Vercel project, complete Vercel's DNS verification, and decide whether `www` redirects to the apex domain.
2. Create/connect a Vercel Blob store and Upstash Redis database. Add their credentials to Preview and Production; confirm both integrations are in the same Vercel project.
3. Add the secrets above, then redeploy a Preview. Verify a recording upload, transcription, generated speech, quota response, and cleanup. The daily cleanup cron is declared in `vercel.json`; it requires `CRON_SECRET`.
4. Enable Web Analytics in the Vercel project. Analytics only sends page views and tool/action completion events; it never sends audio, filenames, text, or transcripts.
5. For now, use `https://speechpocket.vercel.app/sitemap.xml`. After the custom domain is attached, update `NEXT_PUBLIC_SITE_URL`, verify the domain in Google Search Console, redeploy, and submit its sitemap.
6. Configure the support inbox before pointing visitors to it. Have the business operator review the Terms and Privacy pages for the actual operator, target countries, and local legal requirements.

## Launch boundary

No ad network is installed. Add ads only after an ad account is approved, the exact ad provider and consent requirements are known, and the Privacy page is updated. Do not publish this build as a promise of confidential-file handling: temporary upload URLs can be opened by anyone who obtains the URL until the file is deleted.
