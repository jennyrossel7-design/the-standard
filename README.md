# The Standard

A private practice for returning to yourself.

Built from `the-standard-app-claude-build-brief.md` (product and design source of truth),
porting the validated Phase 1 prototype to a real stack with sign-in and multi-device sync.

## Stack

- React + TypeScript + Vite
- Local-first storage in IndexedDB; every write lands on the device before the network
- Supabase for authentication and sync (row-level security: your rows, your account only)
- Deployed to GitHub Pages at https://the-standard.app

## Setup

1. Run `supabase/schema.sql` once in the Supabase SQL Editor.
2. `npm install && npm run dev`

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are publishable values; data is
protected by sign-in and row-level security, not by hiding them.

## Not implemented

Reminders, voice notes and transcription, and AI reflection are not built. Where they
appear in the interface they are labeled honestly as future features, never simulated.
