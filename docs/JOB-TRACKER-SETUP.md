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

## Configured deployment

The account owner created D1 `switch-fix-jobs` and executed the three-table
migration in the Cloudflare console on October 16, 2026. The verified database ID,
JOBS_DB binding, hourly cleanup trigger, Access issuer, application audience,
and exact staff allowlist are included in `wrangler.jsonc`.

Cloudflare Access application `62ddd4fa-85bf-4b05-819b-6ed88d13f697`
covers `www.switchfixelectrical.com/team` and
`www.switchfixelectrical.com/api/team`, including their child paths.
Its only Allow include rule is `info@switchfixelectrical.com`.
One-time PIN is enabled on the account. The public website, `/track`, and
`/api/tracking` remain outside Access.

The Worker independently validates signed Access JWTs, their issuer, audience,
expiry, and exact approved staff email. Direct workers.dev requests cannot
bypass authentication. These configuration identifiers are public identifiers,
not passwords or API credentials.

After deployment, verify an allowed and denied staff session. On an actual phone,
log in at `/team`, create a test appointment, consent to location sharing,
select On My Way, and copy the private customer link. Open it in a separate
private browser. Verify fresh and stale locations, Stop sharing, Mark Arrived,
denied geolocation, and expiration before adding real customer records.

For future databases, apply `migrations/0001_job_tracker.sql` before deployment.
The migration uses IF NOT EXISTS and can be safely re-applied to this database.

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
