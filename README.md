# Ian.Analyst — Portfolio + Admin Dashboard

Built with Vite, React, Tailwind CSS, Framer Motion and Supabase (Postgres, Auth, Storage and Realtime).

- **Public site:** a left sidebar where each link opens its own page (Home, About, Expertise, Certifications, Projects, Blog, Shop, Experience with Achievements, Affiliation), a profile photo that turns toward your cursor, and dark mode.
- **Secret admin login:** click **"Ian"** in the sidebar logo **3 times quickly**.
- **Admin dashboard (`/admin`):**
  - Live viewers right now (Realtime presence).
  - Total, unique, today and 7-day views, with views streaming in live.
  - A 14-day chart.
  - Full CRUD with image and PDF uploads for all 7 content tables.

---

## Folder structure

```
web/
├── index.html                 # Fonts, Font Awesome, no-flash dark-mode script
├── package.json
├── vite.config.js             # Vendor chunk splitting
├── tailwind.config.js         # Brand colors, dark mode = 'class', typography plugin
├── postcss.config.js
├── .env.example               # Copy to .env.local
├── vercel.json                # SPA rewrites (Vercel)
├── public/
│   ├── _redirects             # SPA rewrites (Netlify)
│   ├── img/                   # Your photo + certificate images
│   └── pdf/                   # Resume + certificate PDFs
├── supabase/migrations/
│   ├── 001_init.sql           # Tables, RLS, triggers, analytics RPCs, storage bucket, realtime
│   └── 002_seed.sql           # Content migrated from the old index.html
└── src/
    ├── main.jsx               # Providers: Router → Motion → Theme → Toast → Auth → Presence
    ├── App.jsx                # Routes + animated page transitions
    ├── index.css              # Tailwind layers + shared component classes (.btn-primary, .card, .input…)
    ├── lib/
    │   ├── supabase.js        # Supabase client (null-safe until keys are set)
    │   ├── constants.js       # ADMIN_EMAIL, nav links, socials, tools
    │   ├── storage.js         # uploadFile() / removeFileByUrl() for Supabase Storage
    │   ├── format.js          # price, date, slug, reading-time helpers
    │   ├── motion.js          # Shared Framer Motion variants
    │   └── session.js         # Anonymous visitor id
    ├── context/
    │   ├── AuthContext.jsx    # signIn (admin email only), signOut, isAdmin
    │   ├── ToastContext.jsx   # Animated toast notifications
    │   ├── ThemeContext.jsx   # Light/dark toggle
    │   └── PresenceContext.jsx# Realtime "who's online" channel
    ├── hooks/                 # useCollection, useTrackView, useTypewriter, useActiveSection
    ├── components/
    │   ├── layout/            # Sidebar (secret trigger + mobile drawer), Footer, ThemeToggle, AdminBar
    │   ├── auth/              # AdminLoginModal, ProtectedRoute
    │   ├── sections/          # One component per page + FollowingPortrait (cursor-tracking photo)
    │   ├── blog/BlogCard.jsx
    │   └── ui/                # Modal, Toggle, ConfirmDialog, Reveal/Stagger, SectionHeading, States
    ├── pages/                 # Home, BlogIndex, BlogPost, NotFound
    └── admin/
        ├── resources.js       # ⭐ Config for every CRUD table (fields, labels, toggles)
        ├── ResourceManager.jsx# Generic list / search / toggle / delete
        ├── ResourceForm.jsx   # Generic create/edit form built from resources.js
        ├── fields.jsx         # Upload, Tags, Markdown editor, Boolean fields
        ├── AnalyticsPanel.jsx # Stat tiles, live viewers, daily chart, recent visits
        └── AdminDashboard.jsx # Tabs shell (lazy-loaded — not in the public bundle)
```

---

## Step-by-step setup

### Step 1 — Run it locally (no backend yet)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. The site works, but the database sections show "coming soon" until Step 4.

### Step 2 — Create the Supabase project

1. Go to https://supabase.com, sign in, and click **New project**.
2. Name it `ian-portfolio`, set a strong **database password** (save it somewhere), and pick the region **Southeast Asia (Singapore)**.
3. Wait about 2 minutes for it to finish setting up.

### Step 3 — Create the database

1. In the dashboard, open **SQL Editor** and click **New query**.
2. Paste the whole of `supabase/migrations/001_init.sql` and click **Run**. You should see "Success. No rows returned".
3. Open another **New query**, paste `supabase/migrations/002_seed.sql`, and click **Run**. This adds your 2 certificates, 6 projects, 1 achievement and a sample blog post.
4. Check the result:
   - **Table Editor** should list 8 tables.
   - **Storage** should have a public bucket named `portfolio`.

### Step 4 — Connect the app

1. Go to **Project Settings → API** (also labelled "Data API" or "API Keys").
2. Copy the **Project URL** and the **anon / publishable** key.
   - ⚠️ Never use the `service_role` / secret key in the frontend.
3. In the `web/` folder, copy `.env.example` to a new file named `.env.local` and fill it in:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...   (or sb_publishable_...)
   ```
4. Stop the dev server (Ctrl+C) and run `npm run dev` again. Vite only reads `.env` files when it starts. Your seeded content should now appear.

### Step 5 — Create your admin account (and lock signups)

1. Go to **Authentication → Users → Add user → Create new user**.
   - Email: `ianearlbesanez@gmail.com`
   - Password: a strong one.
   - ✅ Tick **Auto Confirm User**.
2. Go to **Authentication → Sign In / Providers** (or **Settings**) and turn **off** "Allow new users to sign up". Only the account you just created can ever sign in.
3. Go to **Authentication → URL Configuration** and set **Site URL** to `http://localhost:5173`. Change it to your real domain after you deploy (Step 7).

### Step 6 — Try the admin features

1. On the site, click **"Ian"** in the sidebar logo **3 times quickly**. The Admin Access modal opens.
2. Sign in, and you'll land on `/admin`. From there you can:
   - **Overview:** see the live viewer count, total and unique views, and the 14-day chart. Open the site in an incognito window to watch your viewer count go up.
   - **Shop / Blog / Projects / Certificates / Achievements / Experience / Affiliation:** use **New**, edit (✏️), delete (🗑), and the inline toggles (Visible, Published, Featured).
   - **Uploads:** the **Upload** buttons store files in the `portfolio` Storage bucket.
3. While you're signed in, the public site shows a floating admin bar and **Manage** pills under each section heading.

### Step 7 — Deploy (free, on Vercel)

1. Push the project to GitHub.
2. On https://vercel.com, click **Add New → Project** and import the repo.
3. Set **Root Directory** to `web`. Vercel detects the Vite framework automatically.
4. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Click **Deploy**. `vercel.json` already makes routes like `/blog/my-post` and `/admin` work on refresh.
6. Back in Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your Vercel URL (or your custom domain).

(For Netlify, use base directory `web`, build command `npm run build`, publish directory `web/dist`. `public/_redirects` handles routing.)

---

## How the security works

| Layer | What it does |
|---|---|
| `public.is_admin()` (SQL) | Returns true only when the signed-in user's JWT email is `ianearlbesanez@gmail.com`. |
| **RLS policies** | Everyone can **read** content. Only `is_admin()` can **insert/update/delete**. Drafts (`published = false`) and hidden products (`is_active = false`) are visible only to the admin. |
| `profile_views` | No one can write to it directly. Visitors call `track_view()`, which stores at most 1 view per browser every 30 minutes and never counts the admin. Only the admin can read it. |
| Storage policies | Anyone can read files in the `portfolio` bucket. Only the admin can upload, replace or delete them. The bucket has a 10 MB limit and accepts only images and PDFs. |
| Frontend checks | The login form rejects any other email, and `ProtectedRoute` hides `/admin`. These are for convenience only. **The database is the real lock**: even with the anon key, nobody else can change data. |

The triple-click on "Ian" only *hides* the login. It isn't security, and it doesn't need to be.

---

## Common tasks

- **Add a field to a section:**
  1. Add the column in SQL, e.g. `alter table public.projects add column video_url text;`
  2. Add one line to that table's entry in `src/admin/resources.js`.
  3. Show the field in the matching `components/sections/*.jsx` file.
- **Change the admin email:** update it in **two** places: `is_admin()` in SQL (then re-run that function) and `ADMIN_EMAIL` in `src/lib/constants.js`.
- **Reset analytics:** run `truncate public.profile_views;` in the SQL Editor.
