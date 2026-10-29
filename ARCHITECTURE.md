# CTRL+BLCK Architecture & Design System

This document provides a technical overview of the project structure, component organization, and design system.

---

## 📂 File Structure Overview

```text
web-blocker/
├── extension/                # Chrome Extension source code
│   ├── assets/               # Fonts and Icons
│   ├── background/           # Service workers (sync, background logic)
│   ├── content/              # Content scripts (blocking overlays, dashboard sync)
│   ├── lib/                  # Shared utilities and constants
│   ├── popup/                # Extension popup UI (HTML/CSS/JS)
│   └── manifest.json         # Extension configuration
├── website/                  # Next.js Dashboard
│   ├── public/               # Static assets
│   └── src/
│       ├── app/              # Next.js App Router pages, API route, sitemap/robots, OG images
│       ├── components/       # UI Components
│       │   ├── auth/         # Provider icons, Sign-out and Switch-account modals
│       │   ├── dashboard/    # Core feature components (Stats, URL management)
│       │   ├── layout/       # Sidebar, Header, ExtensionGate, landing header CTA
│       │   └── ui/           # Reusable atomic UI elements (Button, Modal, DayPicker, ...)
│       ├── config/           # env.ts (Supabase env), site.ts (SEO constants), sync.ts (sync contract)
│       ├── data/             # Static content (landing-faq.ts)
│       ├── hooks/            # Custom logic (useAuth, useFocusSessions, etc.)
│       ├── lib/              # Supabase client, schedule/URL helpers, SEO helpers
│       └── types/            # TypeScript interfaces
├── shared/                   # Logic shared between extension and website
│   ├── url-utils.js          # Source of truth for URL normalization/validation
│   ├── schedule-utils.js     # Source of truth for block-window logic (times + weekdays)
│   └── sync-contract.json    # Storage keys, message actions, origins and extension ID
├── scripts/                  # config:extension and build:extension:dev
└── *.test.js                 # Node test suite (run with `npm test`)
```

---

## 🎨 Design System & Colors

The project follows a **Neobrutalist** design aesthetic characterized by high contrast, thick borders, and heavy shadows.

### Global Tokens
| Token | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary (Red)** | `#FF4141` | Action buttons, Block screen, Brand highlights |
| **Black** | `#000000` | Borders, Text, Heavy shadows, Active states |
| **White** | `#FFFFFF` | Backgrounds, Secondary buttons |
| **Gray (Light)** | `#F9FAFB` | Background tiles, Hover states |
| **Gray (Dark)** | `#6B7280` | Subtitles, Secondary metadata |

### Component Specific Colors (Stats Cards)
| Theme | BG (50) | Text (600) | Usage |
| :--- | :--- | :--- | :--- |
| **Blue** | `#EFF6FF` | `#2563EB` | Total Sessions |
| **Green** | `#F0FDF4` | `#16A34A` | Last Active |
| **Purple** | `#FAF5FF` | `#9333EA` | Focus Time |
| **Orange** | `#FFF7ED` | `#EA580C` | Custom Metrics |

---

## 🧩 Key Component Directories

### Website (`website/src/components`)
- **`layout/`**: Contains `Sidebar.tsx` and `Header.tsx`. These manage the main navigation and are shared across all dashboard pages.
- **`dashboard/`**:
    - `StatsCard.tsx`: The metric cards at the top of pages.
    - `UrlList.tsx`: Manages the display and deletion of blocked URLs.
    - `TimerDisplay.tsx`: The digital countdown clock used in Focus Sessions.
- **`auth/`**: Components for user onboarding and session management: `ProviderIcons.tsx` (Google/GitHub), `SignOutModal.tsx`, and `SwitchAccountModal.tsx` (re-runs OAuth with an account picker).
- **`layout/ExtensionGate.tsx`**: Blocks dashboard pages until the extension is detected (bypass with `NEXT_PUBLIC_SKIP_EXTENSION_CHECK=true`).
- **`ui/DayPicker.tsx`**: Weekday selector used when scheduling a block window.

### Website Pages (`website/src/app`)
| Route | Purpose |
| :--- | :--- |
| `/` | Public landing page with FAQ (`data/landing-faq.ts`, also emitted as FAQPage JSON-LD) |
| `/login`, `/signup`, `/auth/callback` | Email/password and Google/GitHub OAuth sign-in |
| `/install` | Guided extension install; `/api/download-extension` builds the zip from GitHub and injects `lib/config.js` |
| `/dashboard` | Blocked-site list management |
| `/sessions` | Block windows: daily time range plus selected weekdays per site |
| `/settings/*`, `/account` | Appearance, privacy & security, sync status, account |
| `/privacy` | Public privacy policy |

### SEO
- **`config/site.ts`**: Single source for site URL (`NEXT_PUBLIC_SITE_URL`), name, title and description.
- **`sitemap.ts` / `robots.ts`**: Only `/`, `/install` and `/privacy` are listed; `/api/` and `/auth/` are disallowed.
- **`opengraph-image.tsx` / `twitter-image.tsx`**: Generated social preview images.
- **`lib/seo.ts`**: `privateMetadata()` applies `noindex` to signed-in/utility pages (via each route's `layout.tsx`), and `jsonLd()` safely serialises structured data.
- The Press Start 2P pixel font is preloaded from `app/fonts`.

### Extension (`extension/`)
- **`popup/`**: The small window that appears when clicking the browser icon.
- **`content/content.js`**: The script responsible for injecting the "SITE BLOCKED" overlay and the "Retro Timer" on blocked pages.
- **`content/dashboard-sync.js`**: Bridges the dashboard page and the extension (session, guest status, site lists).
- **`background/background.js`**: The "brain" that syncs with Supabase every 2 minutes (`chrome.alarms`) and manages the list of URLs to block. When the access token expires and no dashboard tab is open, it refreshes the token itself using the stored refresh token.
- **`lib/`**: `guest-site-store.js` (guest-mode records with last-write-wins merging), `sync-constants.js` (exposes the sync contract), plus mirrors of `url-utils.js` and `schedule-utils.js`.

---

## 🔄 Data Flow & Hooks
- **`useAuth.ts`**: Manages Supabase authentication state (email/password, Google/GitHub OAuth, switch account) and the Guest Mode toggle.
- **`useBlockedSites.ts`**: Syncs the `blocked_sites` table (or the guest store). Notifies the extension of changes via custom events.
- **`useExtensionDetected.ts` / `useExtensionSyncStatus.ts`**: Detect the installed extension and report its sync state (`synced`, `guest_local`, `not_authenticated`, `error`, `not_installed`).
- **`useFocusSessions.ts`**: Handles the creation and tracking of timed sessions. Automatically calculates stats for "Today", "Week", and "All-time".
- **`lib/extensionAuthStorage.ts`**: supabase-js storage adapter. On first load it adopts a fresher session from the extension, then mirrors writes back, so the website and extension share one refresh-token chain and neither signs the user out.
- **`lib/guestRedirect.ts`**: Decides where guests land after login/callback.

### Block Windows
A site's `access_window` (`enabled`, `start`, `end`, optional `days`) defines when it is **blocked**; outside the window it is accessible, and no window means blocked at all times. `days` uses 0 = Sunday … 6 = Saturday and is omitted for "every day". Overnight windows belong to the day they start on.

---

## 🛠️ Shared Utilities
- **`shared/url-utils.js`**: This is the single source of truth for all URL normalization and validation logic. It is used by:
    - The **Chrome Extension** (via `extension/lib/url-utils.js` copy) to ensure consistent blocking matches.
    - The **Website Dashboard** to sanitize user input and maintain consistent database entries.
- **`shared/schedule-utils.js`**: Block-window parsing, weekday handling and next-transition calculation. The extension keeps a content-script-safe mirror in `extension/lib/schedule-utils.js`; keep the two in sync.
- **`shared/sync-contract.json`**: Constants both sides must agree on (extension ID, dashboard origins, storage keys, message actions). The website imports it through `config/sync.ts`; the extension mirrors it in `lib/sync-constants.js`. `sync-contract.test.js` guards against drift.

---

## 🧪 Testing
`npm test` runs the Node test suite at the repo root: URL normalization, schedule logic, the sync contract, and guest-mode behaviour (last-write-wins merging, redirects, site store).
