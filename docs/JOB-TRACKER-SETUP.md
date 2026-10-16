# Switch & Fix private job tracker

## Included

- `/team`: staff-only job board, create/edit job forms, estimates, manual payments,
  a calculated 50% deposit target, appointment windows, notes, and up to five photos.
- Technician **On My Way**, **Stop sharing**, and **Mark Arrived** controls.
- `/track#<random-token>`: private customer trip page. Tokens are generated with
  256 bits of randomness, stored only as SHA-256 digests, expire after eight hours,
  and are kept out of URL request logs by using a fragment. The customer page removes
  the fragment from the address bar after reading it.
- Customer polling every 15 seconds. Positions older than two minutes are hidden.
  Customer responses exclude names, email addresses, phone numbers, service addresses,
  estimates, payment records, staff notes, and job photos.
- Latest position can be opened in OpenStreetMap by the customer; the page explains
  that doing so shares the trip coordinates with OpenStreetMap. No map API key is needed.
- Job photo metadata is removed when the browser redraws images before uploading.

The dashboard is **not production-ready until the account setup below is completed**.
Without Access configuration, protected routes return 503; without a valid signed
Access JWT and an allowed staff email, they return 401. There is no development
password, public bypass, or browser-only protection.

## Cloudflare setup (account owner)

1. Create a Cloudflare D1 database named `switch-fix-jobs`. Add this root-level
   binding to `wrangler.jsonc`, using the real returned database ID:

   ```json
   "d1_databases": [{
     "binding": "JOBS_DB",
     "database_name": "switch-fix-jobs",
     "database_id": "<actual-database-id>",
     "migrations_dir": "migrations"
   }],
   "triggers": { "crons": ["0 * * * *"] }
   ```

   No placeholder database ID has been added to the production configuration.
   Apply the migration before deployment:

   ```sh
   npx wrangler d1 migrations apply JOBS_DB --remote
   ```

2. Create one Cloudflare Access self-hosted application covering BOTH paths on
   `www.switchfixelectrical.com`: `/team*` and `/api/team*`. Use the same Access
   application/audience for both. Permit only the exact staff login email addresses
   approved by the owner. Email one-time PIN is suitable if enabled in Access.
   Do not add a Bypass or Everyone policy. Do not protect `/track` or `/api/tracking`.
   Staff sessions are independently verified by the Worker, so a workers.dev URL
   cannot bypass authentication.

3. Configure Worker variables/secrets:

   - `ACCESS_ISSUER`: `https://<your-team>.cloudflareaccess.com` (no trailing slash).
   - `ACCESS_AUD`: the application audience tag from step 2.
   - `STAFF_EMAILS`: comma-separated exact approved staff emails.

   None of these values are filled with guessed account information. Set them through
   the Cloudflare dashboard or `wrangler secret put NAME`. Never put passwords or
   private customer information in this public repository.

4. Run `npm run build`, deploy the generated Worker using the project's existing
   Cloudflare build pipeline, and verify both an allowed and a denied staff session.
   Ensure the D1 binding is preserved in the deployment configuration.

5. On an actual phone, log in at `/team`, create a test appointment, consent to
   location sharing, select On My Way, and copy the generated private customer link.
   Open it in a separate private browser. Verify fresh and stale locations, Stop
   sharing, Mark Arrived, denied geolocation, and expiration. Do not start with
   real customer records until these checks pass.

## Operation and limits

- Jobs and payments are entered manually. The existing website inquiry form still
  sends email through FormSubmit. Square payment synchronization, SMS/email sending,
  automatic inquiry import, and automatic invoicing are not included.
- The website uses browser geolocation. Keep the staff trip page open and the phone
  awake. Background/locked-phone GPS needs a dedicated mobile tracking service.
- There is no traffic-derived ETA or automatically updating embedded road map.
  The customer sees the appointment window and a link to the latest fresh position.
- Phone location permission is required. Turning off consent after starting also stops sharing. Arrival stops sharing and clears
  stored trip coordinates. Closing the page attempts to stop sharing; if offline,
  customers stop seeing the last position after two minutes and the link expires.
- Expired coordinates are cleared on API activity and by the hourly cron above.
  Old trip digests and job/photo records remain for business recordkeeping. Decide
  a business retention policy before adding large volumes of customer data.
- Five photos per job, 400 KB each after resizing; no attachments other than
  JPEG/PNG/WebP images. D1 is suitable for this small starting volume; move photo
  storage to private R2 if volume grows. The job list returns the 500 latest jobs.
- Use Cloudflare rate-limiting/WAF rules for the API if abuse appears. Monitor
  D1/Worker usage before exceeding the account's plan limits.

## Checks

`node --test tests/tracker.test.mjs` tests signed JWT validation, denied users,
wrong audience, expiry, forged signatures, same-origin writes, job validation,
optimistic update conflicts, unguessable link isolation, stale positions,
arrival shutdown, and rejected image types. Browser scripts are parsed as well.

References:
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/d1/reference/migrations/
