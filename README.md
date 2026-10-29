<h1 align="center" id="title">CTRL+BLCK</h1>

<p align="center"><img width="800" height="600" alt="mircosoft-forms header" src="https://github.com/user-attachments/assets/a95c32d3-cfed-4f54-9aaf-ab15b426dcb7" /></p>

<p id="description">⛔ CTRL+BLCK ⛔- A Chrome extension and web dashboard that boosts productivity by blocking distracting websites, synced to the cloud with Supabase.</p>

<h2>🖼️ Screenshots</h2>
<h3>1. Pop-up with the blocked URLs</h3> <br>
<img width="485" height="580" alt="Screenshot 2025-09-11 115407" src="https://github.com/user-attachments/assets/82142cf8-08f1-476e-be51-2f6282f16791" />
<br>
<h3>2. Confirmation Page after Adding the website</h3> <br>
<img width="590" height="610" alt="Confirmation Page" src="https://github.com/user-attachments/assets/e7528ba0-4094-4650-9727-2270ec9007d1" />
<br>
<h3>3. A blocked website with a countdown</h3><br>
<img width="1919" height="879" alt="Blocked Site" src="https://github.com/user-attachments/assets/0e19c251-33df-41ab-bcdb-3b3ce17fcf33" />
<br>
<h3>4. Main Website with URL List</h3><br>
<img width="1919" height="864" alt="Main Website" src="https://github.com/user-attachments/assets/cd881434-3f76-4d8e-94fa-2ce3fcec522c" />

<h2>🧐 Features</h2>
Here are some of the project's best features:

*   Block distracting websites instantly by adding them to your block list
*   Automatic URL detection - extracts clean hostnames from full URLs
*   Real-time blocking - websites are blocked immediately after adding
*   Quick add functionality - one-click to block the current website
*   Cloud sync - block list synced across devices via Supabase
*   Guest mode - use the blocker locally without an account
*   Block windows - block a site only during a daily time range (overnight ranges like 22:00–06:00 supported)
*   Weekday scheduling - limit a block window to selected days of the week (e.g. weekdays 9:00–17:00)
*   Background sync - the extension keeps pulling your block list every 2 minutes, even with the dashboard closed
*   Focus sessions with stats for Today, Week, and All-time
*   Account auth with email/password or Google/GitHub OAuth, plus a Switch Account flow
*   Install page - guided, step-by-step extension setup that detects when the extension is active
*   SEO-ready landing page - metadata, sitemap, `robots.txt`, and generated Open Graph/Twitter images

<h2>💻 Built with</h2>

Technologies used in the project:

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   Supabase (Auth + Postgres)
*   Chrome Extensions Manifest V3
*   Chrome Extension APIs

<h2>📂 Project Structure</h2>

```text
web-blocker/
├── extension/                # Chrome Extension source code
│   ├── background/           # Service workers (sync, background logic)
│   ├── content/              # Content scripts (blocking overlays, dashboard sync)
│   ├── lib/                  # Shared utilities, guest store, sync constants
│   ├── popup/                # Extension popup UI (HTML/CSS/JS)
│   └── manifest.json         # Extension configuration
├── website/                  # Next.js Dashboard
│   └── src/
│       ├── app/              # App Router pages (landing, login, dashboard, sessions,
│       │                     #   settings, install, account, privacy), API route,
│       │                     #   sitemap/robots and OG image generation
│       ├── components/       # UI Components (auth, dashboard, layout, ui)
│       ├── config/           # Env validation, site/SEO constants, sync contract import
│       ├── data/             # Static content (landing page FAQ)
│       ├── hooks/            # Custom logic (useAuth, useBlockedSites, etc.)
│       ├── lib/              # Supabase client, schedule/URL helpers, SEO helpers
│       └── types/            # TypeScript interfaces
├── shared/                   # Logic shared between extension and website
│   ├── url-utils.js          # URL normalization/validation source of truth
│   ├── schedule-utils.js     # Block-window schedule logic (times + weekdays)
│   └── sync-contract.json    # Storage keys, message actions and origins used by both sides
├── scripts/                  # Build and config scripts
└── *.test.js                 # Node test suite (normalization, schedules, sync, guest mode)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (npm workspaces)
- A Supabase project with the following table:

```sql
create table public.blocked_sites (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id),
  url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  access_window jsonb       -- { "enabled": bool, "start": "HH:MM", "end": "HH:MM", "days": [0-6] }
);

alter table public.blocked_sites enable row level security;

create policy "blocked_sites_own_all" on public.blocked_sites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

`access_window` describes when the site is **blocked**. Outside the window the site is accessible, and no window (or a disabled one) means the site is blocked all the time. `days` is optional (0 = Sunday … 6 = Saturday); when omitted the window applies every day. An overnight window belongs to the day it starts on, so Mon 22:00–06:00 also covers early Tuesday.

To enable OAuth sign-in, turn on the **Google** and/or **GitHub** providers in your Supabase project (Authentication → Providers) and add the dashboard's `/auth/callback` URL to the allowed redirect URLs.

### Setup

1. Clone this repository and install dependencies:

```bash
npm install
```

2. Configure the website environment variables by creating `website/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SKIP_EXTENSION_CHECK=false
# Optional: canonical site URL for sitemap, robots and Open Graph metadata
# (defaults to https://ctrl-blck.vercel.app)
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`NEXT_PUBLIC_SKIP_EXTENSION_CHECK=true` skips the "extension installed" gate, which is handy when developing the dashboard without the extension.

3. Generate the extension config (reads from `website/.env.local` and writes `extension/lib/config.js`, which is gitignored):

```bash
npm run config:extension
```

4. Start the dashboard locally:

```bash
npm run dev:web
```

### Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev:web` | Start the website dashboard in development mode |
| `npm run build:web` | Build the website for production |
| `npm run lint:web` | Lint the website |
| `npm test` | Run the Node test suite (`node --test ./*.test.js`) |
| `npm run typecheck -w website` | Type-check the website |
| `npm run config:extension` | Generate extension config from `.env.local` |
| `npm run build:extension:dev` | Build a dev extension into `extension-dev/` (pointed at `http://localhost:3000`) |

`npm run dev:web` and `npm run build:web` run `config:extension` automatically.

## 🔌 Loading the Extension

1. Run `npm run config:extension` to generate `extension/lib/config.js` (required before loading).
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` folder
5. The CTRL+BLCK icon should appear in your browser toolbar

For local dashboard development, run `npm run build:extension:dev` and load the generated `extension-dev` folder instead. It talks to `http://localhost:3000` rather than the production dashboard.

End users can also follow the guided steps on the dashboard's `/install` page, which downloads the extension as a zip.

## 📖 How to Use

1. **Quick Block**: Click the CTRL+BLCK icon while on any website and hit "ADD SITE +"
2. **Manage Sites**: Open the web dashboard to add, remove, or toggle sites
3. **Remove Sites**: Use the delete icon next to any site in your block list
4. **Search & Filter**: Use the search bar to find specific blocked sites quickly
5. **Schedule Blocking**: On the Sessions page, give a site a block window (start/end time) and pick the days of the week it applies to. The site is blocked during the window and accessible outside it; sites without a window stay blocked all day
6. **Guest Mode**: Skip sign-up to keep your list locally in the browser; sign in later to sync it across devices
7. **Check Sync**: Settings → Sync Status shows whether the extension is connected and when it last synced

### Pro Tips:
- The extension shows only the last 5 sites in the pop-up for quick access
- Use the web dashboard for full site management
- Sites are blocked immediately after adding - just reload the page!
- Changes made on another device are picked up by the extension within a couple of minutes, even if no dashboard tab is open

## 📝 Feedback & Suggestions

Facing any new issues or have new ideas to implement?
https://forms.gle/ddef4SouyJ6W2ShV8
