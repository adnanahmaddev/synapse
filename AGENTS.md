<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — AI Agent Reference for Synapse

This file is the entry point for AI agents working in this repository. Read this first, then load the full technical context from `PROJECT_KNOWLEDGE.md`.

> **This file is gitignored** — it is for local agent use only and is never committed to remote.

---

## What This Repo Is

**Synapse** is an AI-powered personalized learning platform. It contains:

- A **Next.js 16 App Router** frontend under `src/app/`
- **React 19** components under `src/components/`
- **Server-side Gemini AI** calls via Next.js Route Handlers under `src/app/api/`
- Client-side state persisted in `localStorage` with `synapse_*` keys

---

## Read This Before Starting Any Task

📖 See [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md) for:
- Stack, ports, and run commands
- Directory layout and component map
- localStorage key schema
- Coding conventions (TypeScript, Tailwind, Gemini API rules)
- Environment variable reference

---

## Critical Rules

- **Next.js 16 App Router only** — no Pages Router patterns. Always check `node_modules/next/dist/docs/` before using any Next.js API.
- **All Gemini API calls go through Route Handlers** — never call the API key from a client component.
- **No `any` types** in TypeScript.
- **Tailwind CSS v4** — avoid inline `style` props; use utility classes.
- **`synapse_*` localStorage keys** — never use the old `fenzo_*` prefix.

---

## Branch & Commit Conventions

- **Branch format**: `feat/<short-description>` or `fix/<short-description>` from `main`
- **Commit format**: `<type>(<scope>): <imperative summary>` (e.g. `feat(workspace): add math visualizer toggle`)
