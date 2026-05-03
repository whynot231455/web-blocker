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
│       ├── app/              # Next.js App Router pages
│       ├── components/       # UI Components
│       │   ├── auth/         # Login, Signup, Guest components
│       │   ├── dashboard/    # Core feature components (Stats, URL management)
│       │   ├── layout/       # Sidebar, Header, Page wrappers
│       │   └── ui/           # Reusable atomic UI elements
│       ├── hooks/            # Custom logic (useAuth, useFocusSessions, etc.)
│       ├── lib/              # Shared library instances (Supabase client)
│       └── types/            # TypeScript interfaces
└── shared/                   # (Optional) shared code between extension/web
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
- **`auth/`**: Components for user onboarding and session management.

### Extension (`extension/`)
- **`popup/`**: The small window that appears when clicking the browser icon.
- **`content/content.js`**: The script responsible for injecting the "SITE BLOCKED" overlay and the "Retro Timer" on blocked pages.
- **`background/background.js`**: The "brain" that syncs with Supabase every few minutes and manages the list of URLs to block.

---

## 🔄 Data Flow & Hooks
- **`useAuth.ts`**: Manages Supabase authentication state and Guest Mode toggle.
- **`useBlockedSites.ts`**: Syncs the `blocked_sites` table. Notifies the extension of changes via custom events.
- **`useFocusSessions.ts`**: Handles the creation and tracking of timed sessions. Automatically calculates stats for "Today", "Week", and "All-time".
