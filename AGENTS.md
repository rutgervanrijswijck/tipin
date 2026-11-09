# TipIn — Project Guidelines & Architecture

## Overview
This is a development project for a mobile based webapp called TipIn (Next.js 16 App Router, React 19, Supabase, Tailwind CSS v4). TipIn is a sports/social team management app for field hockey student teams in the Netherlands. It tracks events, attendance, polls, fine penalties ("boetes"), player profiles, and more.

## Tech Stack & Conventions
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) + `clsx` / `tailwind-merge`
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Language:** TipIn uses both English and Dutch, but Dutch is preferred for UI text

## Architecture & Directory Layout
- `app/`: Next.js App Router pages and API routes
  - `app/api/ping/`: Lightweight keep-alive health ping endpoint (used by cron-job.org to prevent Vercel and Supabase cold starts)
  - `app/api/cron/check-deadlines/`: Cron endpoint to send push notifications for upcoming deadlines
  - `app/events/[id]/`: Event details, player attendance, captain actions (late/no-show/invalid reason)
  - `app/polls/[id]/`: Polls & voting
  - `app/team/`: Team hub (Roster, Player Profiles `player/[id]`, Stats, Adt-timer, Boetes)
- `components/`: Shared UI components and layout elements
- `utils/`: Supabase clients (client, server, middleware), formatting, and push utilities
- `TODO.MD`: Current backlog, completed features, and future ideas

## Extra Key Project Info
Extra info can be found in the `AGENTS_INFO/` folder, which contains the following files: (currently empty, fill later)
1. **Example file:** `AGENTS_INFO/Example_file.md` contains nothing yet and it an example file

These info files listed above, together with this AGENTS.md file itself, should be kept up-to-date after every change to the project. Info should be added in a file in the extra info folder if it is extensive or not needed to be loaded on every prompt, else it should be put in this AGENTS.md file.

## Supabase MCP Integration
The workspace has the Supabase MCP server enabled and connected to the production project:
- **Project Name:** TipIn
- **Project Ref / ID:** anbsocpcjwqxwbydkpfp (Region: eu-west-1)
- **Capabilities:** Agents should use MCP tools (list_tables, execute_sql, apply_migration, generate_typescript_types) rather than guessing database column names or executing blind schema changes.

## Key Domain Concepts & Rules

### 1. Roles & Permissions
- **Roles:** `captain`, `trainer`, `player` (default: `player`).
- **Statuses:** `active`, `trainingslid`, `on-leave`, `retired`.
- **Captain Superpowers:**
  - Edit or delete any event or poll (regular players cannot edit).
  - Issue infraction fines to players directly from event detail screens.
  - Modify fine pricing defaults in `boete_types`, mark fines as paid, or delete fines.
  - Edit player profiles (including name and role reassignment).
- **Player Limits:** Regular players can only change their own profile name, password, and avatar.

### 2. Events & Calendar
- **Types:** `training`, `match_home`, `match_away`, `social` (Borrels), `eten`, `eten_big_sunday`.
- **Attendance States:** `in`, `out`, `maybe`.
- **Reason Requirements:** Events can flag `reason_required_out` or `reason_required_maybe`, prompting players for an explanation.
- **Carpooling:** Linked to events (`carpools` & `carpool_passengers`). Drivers list available seats; passengers join/leave.

### 3. Polls
- Polls support dynamic choice options (`options` JSONB) and `max_choices`.
- If a poll has `relevant_date` set, it renders in the calendar and schedule views alongside events.

### 4. Deadlines & Boete (Fine) Engine
- Events and polls can define an `answer_by` ISO timestamp.
- **Lockout:** Once `answer_by` expires, players cannot change their vote/attendance (captain override only).
- **Fine Exemption:** Only players with status `'on-leave'` or `'retired'` are exempt from deadline fines.
- **Penalty Types:**
  - `'Missed deadline'`: Automatically issued to non-exempt players with no vote after `answer_by`.
  - `'Arrived late'`: Captain-issued button for players marked `in`.
  - `'No-show'`: Captain-issued button for players marked `in`.
  - `'Invalid reason'`: Captain-issued button for players marked `out` or `maybe`.
  - Fines track status (`unpaid` / `paid`) and trigger instant push notifications to the fined player.

### 5. Adt-Timer
- Stopwatch tracker for team beer chugs. Stores elapsed time in seconds in `adts`.
- Computes leaderboards: all-time fastest records and total adt counts.
- Broadcasts push notifications on new entries.

### 6. Notifications (Web Push)
- Uses `web-push` with service workers.
- Granular settings in `notification_preferences`: `notify_new_poll`, `notify_attendance_deadline`, `notify_poll_deadline`, `notify_fine_received`, `notify_new_borrel`, `notify_new_adt_timer`.
