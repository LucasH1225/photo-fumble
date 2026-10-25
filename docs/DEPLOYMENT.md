# Hosting Photo Fumble: Render and Supabase

Checked against official provider documentation on 24 October 2026. Prices are US
dollars before tax. This repository prepares the app; it does not create paid
accounts or provision cloud resources automatically.

## What you need

Your MacBook is where you develop. To play while it sleeps, use two online services:

| Service | Job | Selected plan |
| --- | --- | --- |
| Render | Runs the website and game server; synchronizes players | One paid 512 MB / 0.5 CPU instance, about $7/month |
| Supabase | Holds private files and the database containing saved game state | Free: 1 GB file storage and 500 MB database |

The database is included in Supabase. No additional database, Redis, persistent disk,
graphics server, or GPU is needed. Render is the hosting company's name.

Sources: [Render pricing](https://render.com/pricing), [Supabase pricing](https://supabase.com/pricing).

## 1. Create Supabase first

1. Sign up at [the Supabase dashboard](https://supabase.com/dashboard).
2. Create or choose a **Free organization**, the account's billing/team container.
3. Create a project named `photo-fumble-demo`.
4. Choose specific **Central EU / Frankfurt (`eu-central-1`)**.
5. Save the database password in a password manager. The app uses the HTTPS SDK,
   so it does not need this password in `.env`.
6. Wait for creation to finish. See [regions](https://supabase.com/docs/guides/platform/regions).

### Private storage

1. Open **Storage → New bucket**.
2. Name it **`photo-fumble-media`**.
3. Leave **Public off**.
4. Set maximum file size to **20 MB**.
5. Restrict stored MIME types to:

```text
image/webp
audio/mpeg
audio/mp4
audio/wav
```

The server converts photos to WebP before storage. Application input limits are
10 MB per image and 20 MB / 60 seconds per recording; actual contents are checked.
Do not add anonymous public-read policies. The backend uploads files and issues
five-minute signed links after checking player permissions. Share the game link,
not private media links, which grant bearer access while valid.

References: [creating buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets),
[file limits](https://supabase.com/docs/guides/storage/uploads/file-limits),
[private downloads](https://supabase.com/docs/guides/storage/serving/downloads).

### Database

1. Open **SQL Editor → New query**.
2. Paste all of `supabase/migrations/001_initial.sql` and run it.
3. It creates `pf_sessions`, `pf_receipts`, and `pf_commit`.
4. Leave Row Level Security enabled. Browser roles have no table/function access;
   only the backend service role receives access.

`pf_sessions` contains the game snapshot and media references. `pf_receipts`
deduplicates retries. `pf_commit` saves an action and its new state in one transaction.
File bytes live in Storage, not in database rows.
See [securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

### Connection values

Open **Project Settings → API Keys**. Get the project URL and a **backend secret
key** (`sb_secret_…`). A legacy service-role key also works. Do not use the
publishable/anonymous key for this backend.

Secret keys bypass RLS. Put them only in local `.env` and Render environment settings,
never frontend code, GitHub commits, or chat messages. Never prefix one with `VITE_`.
See [API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 2. Test the cloud connection locally

Copy `.env.example` to `.env` and fill in:

```dotenv
PORT=3001
APP_ORIGIN=http://localhost:5173
SESSION_NAMESPACE=local
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_BACKEND_SECRET_KEY
SUPABASE_STORAGE_BUCKET=photo-fumble-media
SESSION_SECRET=YOUR_LONG_RANDOM_SECRET
```

Generate a secret in your own terminal:

```bash
node -e 'console.log(require("node:crypto").randomBytes(48).toString("hex"))'
```

Save it privately and keep the production value stable across deployments so guest
cookies remain valid. `.env` is already ignored by Git; `.env.example` is safe to commit.

```bash
npm ci
npm run typecheck
npm test
npm run dev
```

Open `http://localhost:5173`, create a room, join that code from at least three
independent browser profiles, upload an item,
and confirm a session row and storage object appear in Supabase. Development uses
namespace `local`; Render will use `demo`, keeping their game state separate.

Without Supabase variables, development uses local files. Production refuses local
persistence, preventing accidental data loss on Render. To test without cloud
accounts, simply run `npm run dev` without creating `.env`.

## 3. Put the code in GitHub

Use the public `LucasH1225/photo-fumble` repository for this demo. Commit source, lockfile,
SQL migration, and environment template. `.gitignore` excludes `.env`, `.data`,
`node_modules`, `dist`, and test outputs.

Use your normal GitHub Desktop workflow, or initialize and commit after reviewing
the staged files. This implementation does not create a GitHub repository.

## 4. Rent the Render server

1. Sign up at [Render](https://dashboard.render.com); use a **Hobby workspace**.
2. Connect GitHub, preferably granting access only to this repository.
3. Choose **New → Web Service → Git Provider**, then the repository.
4. Select the release branch and a unique service name.
5. Configure:

| Field | Value |
| --- | --- |
| Runtime | Node |
| Region | Frankfurt |
| Root directory | Blank when this app is the repository root |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Instance size | Paid 512 MB / 0.5 CPU option showing about $7/month |
| Instance count | **1** |
| Health-check path | `/api/health` |

The committed `.node-version` selects Node 24. The server binds to `0.0.0.0` and
Render's `PORT`. Frontend, API, and Socket.IO share one address.
References: [web services](https://render.com/docs/web-services),
[Node versions](https://render.com/docs/node-version),
[health checks](https://render.com/docs/health-checks).

### Environment variables

```dotenv
NODE_ENV=production
SESSION_NAMESPACE=demo
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_BACKEND_SECRET_KEY
SUPABASE_STORAGE_BUCKET=photo-fumble-media
SESSION_SECRET=YOUR_PRODUCTION_RANDOM_SECRET
```

Do not copy local `APP_ORIGIN=http://localhost:5173` to Render. The app automatically
uses `RENDER_EXTERNAL_URL`. Set `APP_ORIGIN` only when using a different/custom
domain, to its exact HTTPS origin.

Click **Create Web Service**, watch the log, and wait for the service to become live.
Open its assigned `https://…onrender.com` URL. HTTPS is included; a domain purchase
is optional. See [default environment variables](https://render.com/docs/environment-variables).

Do not add a Render database or disk. Supabase already handles persistence. Render's
normal disk is ephemeral: [storage documentation](https://render.com/docs/disks).

### Use a subdomain of your personal site

No new domain purchase is needed. For example, put the game at
`https://fumble.haojunhan.com`, while the personal homepage stays at `haojunhan.com`.
Alternatively, use Render's included `onrender.com` address for the first test.

1. In the Render service, open **Settings → Custom Domains → Add Custom Domain**.
2. Add `fumble.haojunhan.com` (or the chosen subdomain).
3. At the existing DNS provider for `haojunhan.com`, add a **CNAME** named `fumble`
   pointing to the actual `your-service.onrender.com` hostname supplied by Render.
   Change only records for that chosen subdomain; keep the personal homepage's
   root and `www` records in place.
4. Verify the domain in Render and wait for HTTPS to become ready.
5. Set Render's `APP_ORIGIN=https://fumble.haojunhan.com` and redeploy.
6. Share that one canonical address with players. The app accepts one exact origin
   for actions and sockets; other attached hostnames are not interchangeable game links.

Hobby includes two custom domains and automatic HTTPS certificates. See
[custom domains](https://render.com/docs/custom-domains) and
[subdomain DNS configuration](https://render.com/docs/configure-other-dns).

A dedicated domain can later point to the **same Render service**. Update
`APP_ORIGIN` to its HTTPS address; keep the Supabase project, bucket, namespace, and
session secret. No file migration or second app server is needed. A subdirectory
such as `/fumble` would require extra routing work with the current app; a subdomain
fits the existing implementation directly.

Choose the canonical domain before inviting the demo group. If changing domains
after playing, finish the game, stop the server, and reset the lobby using the
procedure below before resuming on the new address. Guest cookies do not transfer
between hostnames, so players otherwise lose access to their existing identities
and host role. Lobby reset retains media and lets everyone reuse their nicknames.

Account links: [Render signup](https://dashboard.render.com/register),
[Supabase signup](https://supabase.com/dashboard/sign-up),
[GitHub signup, if needed](https://github.com/signup).
An optional dedicated domain can be purchased later, for example through
[Cloudflare Registrar](https://www.cloudflare.com/domains/).

## 5. Rehearse

- Check Supabase is active. Restore it before the presentation if its Free project
  paused after low activity: [pausing guide](https://supabase.com/docs/guides/platform/free-project-pausing).
- Create a room on the Render site and join its code from at least three separate
  devices/profiles. Play all five modes; repeat with a second room to check isolation.
- Test actual iPhone Safari and Chrome, audio playback after a tap, a masked
  screenshot, and a blurred impostor image.
- Refresh one device and confirm the same identity and score return.
- Restart Render between games and verify saved state is restored.
- Keep browser cookies to retain player identity. The host can transfer control in
  **View players**; active players can select a replacement when the host goes offline.
- Disable automatic deploys during the presentation; deploy updates between games.

There is no built-in live call. Remote players can use their existing group call
and/or the text explanations and clues.

### Rooms and existing players

No additional server, storage bucket, or SQL migration is needed for rooms. Keep
`SESSION_NAMESPACE`, `SESSION_SECRET`, and Supabase settings stable. Room codes and
state persist across deployments. They do not expire or get reassigned; files are
retained. The 15-minute idle cache timeout only releases server memory.

The homepage offers Create/Join; each room has an invite link, code, and Leave room.
Leave disconnects only that tab. Existing cookies restore that browser's player on
return; a new device has no account-based identity recovery and needs a new nickname.
The old shared session and original media keys remain in the original namespace;
existing members use **Resume previous game** (`/legacy`). It accepts no new members.

Use one Render instance: online presence and service queues are process-local.
Room creation allows 10 requests/IP/15 minutes; joining allows 100/IP/15 minutes.
All rooms share the three-upload processing limit on the small server.

### Reset a room without deleting files

For an offline host, first use the in-game host selector to assign a connected
participant. An operator reset is only needed when the whole session must be cleared.

Stop/suspend the server first. In a terminal configured with the same Supabase project
and `SESSION_NAMESPACE=demo`, run the legacy reset below. For a coded room, add
`--room 123456` to target only that room (replace the example code). Never reset a
room while its participants are playing:

```bash
# Original shared game only:
npm run session:reset -- --confirm
# One coded room only:
npm run session:reset -- --room 123456 --confirm
```

Resume/restart Render. Players refresh and join again; the next group chooses a fresh
random host. Stored files and asset references remain. Local resets use namespace
`local` unless explicitly changed. The reset is an operator command, not a public
website button.

## 6. Two-day or weekly cost

Render prorates paid compute by the second, so no weekly/annual contract is needed.
The Hobby workspace has no monthly workspace fee; the paid compute is separate.

| Active time | Approximate compute using a 30-day month |
| --- | ---: |
| 48 hours | $0.47 |
| 7 days | $1.63 |
| 30 days | $7.00 |

These estimates exclude tax, currency conversion, and additional usage. Bandwidth
and build minutes have included allowances; extra usage may be billed. Review
**Billing** and configure a build spend limit. See [Render billing](https://render.com/docs/faq).

Supabase Free has 1 GB storage, a 500 MB database, and separate cached/uncached egress
allowances. Retained uploads and blurred derivatives consume storage. Watch project
usage: [Supabase pricing](https://supabase.com/pricing).

## 7. Stop charges

1. In Render, **Suspend** the paid web service after the demo.
2. Confirm suspension and check Billing for accrued usage or other paid resources.
   Closing your laptop/browser does not stop the hosted computer.
3. Keep Supabase on Free to retain media. This setup does not require Pro.
4. Resume Render, and restore Supabase if paused, when you want to play again.

Do not delete Supabase while you want its files. Project deletion removes database,
files, and configuration: [deletion guide](https://supabase.com/docs/guides/platform/delete-project).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Build fails / package file missing | Repository root, committed lockfile, Node 24, exact build command. |
| Service unhealthy | Runtime logs, required environment variables, SQL migration, `PORT`. |
| Website opens but actions fail | Correct `APP_ORIGIN`; remove localhost override on Render. At least three connected players; host identity. |
| Upload fails | Bucket name, stored MIME allowlist, size/duration, backend secret, project active. Retry after processing finishes. |
| Table/RPC access error | Entire migration run; backend secret used. Do not make tables public. |
| Audio fails | MP3/M4A/WAV, user-tapped playback, retry control for expired links. |
| Players share one identity | Browser tabs share a cookie. Use different profiles, isolated contexts, or devices. |
| Host lost | Original browser/cookies, or stopped-server reset procedure above. |
| Newcomer waiting | Current game must finish; connected newcomers enter the next roster. |

## Opt-in hosted room walkthrough

The ordinary `test:online` command remains read-only. To deliberately test hosted
room gameplay, the following creates five new retained test rooms and uploads
only the repository's synthetic/sample media. It never enters `/legacy` or any
existing room. Do not run it against someone else's deployment.

```bash
ONLINE_ROOM_TESTS=1 ONLINE_ROOM_TEST_URL=https://photo-fumble.onrender.com npm run test:e2e:online
```

It runs the three-player all-five-mode walkthrough alongside another independent
room, then the room/tab/mobile controls test. Uploaded test media and room codes
remain stored, following the ordinary retention policy. Physical Safari/audio
rehearsal is still required separately.
