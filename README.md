# Fitfest Event Management Platform

Complete, reusable full-stack Event Management Website built for college students.

**No terminal required.** Deploy using only GitHub web interface + Vercel.

## What this platform includes

- Public event website (Home, About, Agenda, Speakers, Sponsors, Registration, Venue, Contact…)
- Configurable event branding (colours, logo, fonts, tagline, dates, venue…)
- Dynamic registration forms + three modes (Open / RSVP / Invitation-only)
- Unique QR tickets + staff check-in scanner
- SPOC (Single Point of Contact) assignment on tickets
- Full admin dashboard with role-based access control
- Email system (Resend)
- Neon PostgreSQL + Prisma
- Vercel-ready (serverless)

All Fitfest 2026 details are stored in the database and can be changed from the admin panel.

---

## Student Deployment (Zero Terminal)

### Step 1 – Download & extract
Download `Event_Management_Platform.zip` and extract it.

### Step 2 – Create GitHub repository
1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `fitfest-2026`
3. Keep it **Public** or Private
4. Do **not** initialize with README
5. Click **Create repository**

### Step 3 – Upload files via GitHub web UI
1. On the empty repo page click **uploading an existing file**
2. Drag **all** folders and files from the extracted ZIP (do not drag the outer folder itself)
3. Commit the files

### Step 4 – Import into Vercel
1. Go to [vercel.com](https://vercel.com) → Log in with GitHub
2. **Add New… → Project**
3. Import the repository you just created
4. Framework Preset: **Next.js** (auto-detected)
5. Click **Deploy** (it will fail the first time – that is normal)

### Step 5 – Add Environment Variables
In Vercel → Project → **Settings → Environment Variables** add:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | your Neon connection string | See below |
| `AUTH_SECRET` | long random string (≥32 chars) | Generate at generate-secret.vercel.app/32 |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Update after first successful deploy |
| `RESEND_API_KEY` | `re_...` | From resend.com |
| `RESEND_FROM_EMAIL` | verified sender | e.g. noreply@yourdomain.com |
| `RESEND_FROM_NAME` | Fitfest 2026 | |
| `BLOB_READ_WRITE_TOKEN` | (optional) | From Vercel Storage → Blob |

### Step 6 – Get Neon Database URL
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a free project
3. Copy the **pooled** connection string
4. Paste into Vercel as `DATABASE_URL`

### Step 7 – Redeploy
After adding variables → **Deployments → … → Redeploy**

### Step 8 – First-time Setup
1. Visit `https://your-project.vercel.app/setup`
2. Create the Super Admin account
3. The Fitfest event is automatically seeded
4. You are redirected to `/admin/login`

### Step 9 – Login & customize
- Admin: `/admin/login`
- Public site: `/`

Change colours, logo, schedule, ticket types, SPOCs, pages etc. from the dashboard. No code changes needed.

---

## Local development (optional, for developers only)

```bash
npm install
cp .env.example .env
# fill DATABASE_URL etc.
npx prisma db push
npm run dev
```

Students do **not** need this step.

---

## Key URLs after deployment

| URL | Purpose |
|-----|---------|
| `/` | Public event website |
| `/registration` | Registration form |
| `/ticket/[token]` | Ticket + QR view |
| `/verify` | Staff QR scanner |
| `/setup` | One-time Super Admin creation |
| `/admin/login` | Admin login |
| `/admin` | Dashboard |

---

## Security notes

- Never commit real secrets
- `/setup` works only once (until a Super Admin exists)
- All admin routes check roles on the server
- Passwords are hashed with bcrypt
- QR codes use unpredictable verification tokens

---

## Support

If the first deploy fails, the most common causes are:

1. Missing `DATABASE_URL`
2. Missing `AUTH_SECRET`
3. Neon project not created yet

After fixing env vars, always **Redeploy**.

---

Built for college students who need a real, working event platform without writing code or using a terminal.
