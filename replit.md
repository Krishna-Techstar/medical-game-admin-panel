# Dental College Management Portal

A comprehensive portal for dental colleges featuring distinct teacher (Admin) and student dashboards.

## Features

- **Teacher Dashboard (Admin)**:
  - Class management (shared across all teachers).
  - Student progress tracking and portal access management.
  - Task and Quiz assignment with automated sorting (newest first).
  - Marks management with CSV export capabilities.
  - Global "Assign Task of the Day" system.

- **Student Dashboard**:
  - Daily Task/Quest tracking.
  - Gamified progress with XP, Levels, and Streaks.
  - Course content and assignment management.
  - Real-time notifications for grades and new tasks.
  - Redesigned profile with deep performance analytics.

- **Technical Stack**:
  - **Frontend**: React (Vite) with Tailwind CSS and Shadcn UI.
  - **Backend**: Node.js/Express server (`server/index.js`) running on port 3001 (proxied via Vite).
  - **Database**: Supabase Auth + PostgreSQL KV table (`kv_store_2fad19e1`) for state management.
  - **Workflows**: "Start application" (Vite on port 5000) + "Backend Server" (Express on port 3001).

## Recent Changes

- **Fixed Student Dashboard Layout (Complete)**: Resolved issue where main content was hidden behind sidebar:
  - Changed parent container from `min-h-screen` to `flex flex-1 w-full overflow-hidden` to create proper flex layout
  - Updated sidebar from always `fixed` to `fixed lg:static` - fixed on mobile, inline on desktop
  - Changed sidebar height from `h-screen` to `h-screen lg:h-full` for proper desktop alignment
  - Removed `lg:ml-64` margin from main content since sidebar is now static on desktop
  - Both sidebar and main screen now properly visible side-by-side on desktop without overlap
  - Mobile layout preserved with fixed overlay sidebar and dismiss backdrop
- Redesigned Student Profile to match Admin Settings aesthetic.
- Fixed CORS issues in Edge Functions.
- Implemented shared classes logic using Deno KV prefix scanning.
- Unified "Quest" terminology to "Task" for better UX.
- Optimized student list fetching for mobile performance.
