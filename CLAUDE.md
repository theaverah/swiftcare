@AGENTS.md

# CLAUDE.md — SwiftCare

This file is the primary context guide for Claude Code. Read this fully before doing anything. Also read `BRIEF.md` for the full feature requirements and `DESIGN-SYSTEM.md` for all visual and design rules.

> This file is a living document. Update it whenever something improves, changes, or goes off course — keep it accurate and in sync with the actual state of the project at all times.

---

## Priority Order

When there is any conflict between guidance sources, follow this order:

1. **What the developer says verbally in the chat** — always highest priority
2. **Figma designs** — implement as closely as possible, always takes precedence over MD files
3. **CLAUDE.md / BRIEF.md / DESIGN-SYSTEM.md** — reference and context
4. **Your own best judgment** — use your skills and expertise to fill in any gaps

---

## Project Overview

**SwiftCare** is a telehealth web application built for the Whitecloak Launchpad Builder Round (May 26–30, 2026). It is a hackathon MVP — the priority is a clean, well-designed, and functional product, not an over-engineered one.

The app has two modules:
- **Patient Module** — patients register, find doctors, book consultations, join sessions, and view medical records
- **Doctor Module** — doctors manage schedules, conduct consultations, and write prescriptions and notes

Full feature requirements are in `BRIEF.md`.

---

## Track & Evaluation Criteria

This project is submitted under the **Product Manager Track**. Scoring weights:
- Design & Product Sense: **40%**
- Functionality & Scope: **30%**
- Presentation & Communication: **30%**
- Code Quality: **0%**

This means **design and UX quality matter most**. Every screen should feel polished, intentional, and trustworthy. Healthcare UX demands clarity, calm, and confidence.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn (Nova preset, Radix) |
| Database | MongoDB Atlas (free M0 cluster) via Mongoose |
| Auth | NextAuth.js v4 with MongoDB adapter |
| File Uploads | UploadThing |
| Real-time | Pusher |
| Video Calls | Daily.co embed (free tier) — no custom video build needed |
| AI Feature | Anthropic Claude API (doctor recommendation based on symptoms) |
| Deployment | Vercel |
| Version Control | GitHub |

---

## Architecture & Code Philosophy

You have full discretion over architecture, folder structure, and all technical decisions. Use your best judgment to keep things clean, scalable, and easy to understand. The following are guiding principles, not strict rules — feel free to deviate if you have a better approach:

- Use clean architecture principles: separation of concerns, single responsibility, no god files
- Follow industry-standard folder structure for a Next.js 15 App Router project
- TypeScript strictly — no `any` types, always define proper interfaces
- App Router only — no pages router
- Server components by default — use `"use client"` only when necessary
- All backend logic in API routes — keep them clean, commented, and well-structured
- Error handling in all API routes — proper try/catch and HTTP status codes
- Keep components small and focused
- Dummy data — seed at least 6 doctors across different specializations
- Desktop-first but fully responsive

> If you see a better way to structure or implement something, do it and update this file to reflect the change.

---

## What's Already Set Up

- Next.js 15 project with TypeScript, Tailwind CSS v4, ESLint, App Router, src/ directory
- shadcn initialized with Nova preset (Radix), neutral base color
- shadcn components installed: button, input, label, card, badge, avatar, calendar, dialog, select, tabs, sonner
- Packages installed: mongoose, next-auth, @next-auth/mongodb-adapter, mongodb, pusher, pusher-js, zod, react-hook-form, @hookform/resolvers, date-fns, axios, lucide-react, uploadthing, @uploadthing/react

---

## Environment Variables

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
ANTHROPIC_API_KEY=
```

---

## Skills Available

Use these skills whenever relevant. They are available to you throughout this project:

- `senior-frontend`
- `development/senior-backend`
- `development/code-reviewer`
- `creative-design/frontend-design`
- `creative-design/ui-ux-pro-max`
- `web-development/react-best-practices`
- `creative-design/ui-design-system`
- `development/git-commit-helper`
- `development/clean-code`
- `development/react-best-practices`
- `creative-design/tailwind-patterns`
- `development/senior-architect`
- `development/senior-fullstack`
- `development/brainstorming`
- `interface-details`

---

## Workflow

- The developer uses a **Figma-first workflow** — designs are made in Figma first, then handed off via Figma MCP links
- When given a Figma link, implement the design as faithfully as possible
- Figma always takes priority over anything written in these MD files
- Build the scaffold and skeleton first, then refine screen by screen
- When in doubt about visual decisions, refer to `DESIGN-SYSTEM.md`
- When in doubt about features, refer to `BRIEF.md`

---

## MD File Maintenance

Keep all three MD files (`CLAUDE.md`, `BRIEF.md`, `DESIGN-SYSTEM.md`) up to date throughout the project. If something changes, improves, or is no longer accurate — update the relevant file. These are living documents, not locked specs.