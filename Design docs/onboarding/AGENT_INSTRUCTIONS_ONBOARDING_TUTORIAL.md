# Instructions: Create an Onboarding Tutorial for This Platform

## What You Need to Do

Create a **comprehensive, self-contained HTML onboarding tutorial** that teaches a non-technical team member everything they need to know to work on this platform. The tutorial must be based on **what actually exists in this codebase** — not generic knowledge. You must explore this project thoroughly before writing anything.

---

## Who Is This Tutorial For?

The reader is someone who:

- Is **smart and data-savvy** (they handle data well)
- Has **no programming, design, or web development experience**
- Has **never used a terminal, Git, or a code editor**
- Needs to understand the tools, the tech stack, and the workflows used to build and maintain this platform
- Will eventually need to give instructions to AI agents and understand code changes

**This is NOT a developer onboarding doc.** This is a "teach me everything from zero" guide. Assume the reader doesn't know what a terminal is, what Git is, what an API is, or what a framework is. Start from the absolute basics, then build up to the platform-specific knowledge.

---

## Before You Write Anything: Explore the Codebase

**This is critical.** The tutorial must be accurate to THIS platform. Before writing a single line of the tutorial, you must:

1. **Read the project root** — check for README.md, CLAUDE.md, package.json, requirements.txt, docker-compose.yml, or any configuration files that reveal the tech stack
2. **Identify the frontend framework** — Is it React, Vue, Nuxt, Next.js, Svelte, Angular? What version? Check `package.json` dependencies
3. **Identify the CSS approach** — TailwindCSS, styled-components, CSS modules, SCSS, plain CSS? Check config files
4. **Identify the backend framework** — FastAPI, Django, Express, Rails, Laravel? What language? Check requirements.txt, Gemfile, package.json
5. **Identify the database** — PostgreSQL, MySQL, MongoDB, Firebase? Check config, models, migrations
6. **Identify the auth system** — Firebase Auth, Auth0, custom JWT, sessions? Check auth-related files
7. **Map the directory structure** — understand how the project is organized (pages, components, routes, models, services, etc.)
8. **List all components** — especially if there's a design system or component library
9. **List all reusable logic** — composables, hooks, utilities, services
10. **Identify deployment** — Docker, Vercel, AWS, GCP, Heroku? Check Dockerfiles, CI/CD configs, deploy scripts
11. **Read any existing documentation** — docs/, design-docs/, README, CLAUDE.md, etc.
12. **Check recent git history** — understand what features have been built recently
13. **Identify key features** — what does the platform actually do? What pages exist? What API endpoints?

Take thorough notes. Every claim in the tutorial must reflect reality.

---

## Tutorial Structure

The tutorial should be a **single, self-contained HTML file** with:

- Clean, professional design (embedded CSS, no external stylesheets except a Google Font)
- A fixed sidebar with table of contents for navigation
- Smooth scroll between sections
- Code blocks with syntax highlighting (use colored spans, not a library)
- Callout boxes for tips, warnings, and important notes
- Diagrams using monospace text (ASCII art) for architecture and flows
- Responsive layout (works on smaller screens)
- Print-friendly styles

### Required Chapters

Adapt these to the actual tech stack you discover. If this platform uses React instead of Vue, teach React. If it uses MongoDB instead of PostgreSQL, teach MongoDB. The structure below is a guide — match it to reality.

#### Part 1: Universal Foundations

These chapters are needed regardless of the tech stack:

1. **Welcome & Overview** — Who is this for, what they'll learn, big-picture diagram of how the platform works (frontend → backend → database), what the platform does for its users

2. **The Terminal** — What it is, how to open it (macOS and Windows), essential commands (cd, ls, pwd, mkdir, rm, cp, mv), keyboard shortcuts (Tab autocomplete, Ctrl+C, up arrow), package managers (npm/pip/etc. — whichever applies)

3. **Code Editors (VS Code)** — What it is, installation, opening a project, the file explorer, the integrated terminal, key extensions (list the ones relevant to THIS project's stack), essential keyboard shortcuts

4. **Git & GitHub** — What version control is, Git vs GitHub, repositories, commits, branches (with ASCII diagram), staging and committing, pushing and pulling, Pull Requests, the typical daily workflow (pull → branch → code → commit → push → PR)

#### Part 2: Web Fundamentals

5. **How the Web Works** — Client-server model, what an API is, HTTP methods (GET/POST/PUT/DELETE), JSON as a data format, request-response cycle. Use examples from this platform's actual API endpoints.

6. **HTML, CSS & JavaScript** — Brief overview of the three pillars. Keep it short — just enough to understand what they are and how they relate. Mention that the project uses frameworks that build on these.

7. **TypeScript** (if applicable) — What it adds to JavaScript, common types (string, number, boolean, arrays, interfaces). If the project doesn't use TypeScript, skip or replace with whatever type system is used.

#### Part 3: This Platform's Tech Stack

**These chapters must be customized to exactly what this project uses.** Create one chapter per major technology:

8. **Frontend Framework** — Whatever it is (React, Vue, Next.js, Nuxt, Svelte, etc.). Explain what it is, what a component is, key syntax patterns, how routing works. Show real examples from the codebase.

9. **CSS Framework / Styling** — Whatever it is (Tailwind, styled-components, SCSS, etc.). Explain the approach, show common patterns used in this project.

10. **Backend Framework** — Whatever it is (FastAPI, Django, Express, etc.). Explain what it does, how endpoints work, show the project's folder structure. Reference actual route files.

11. **Database** — Whatever it is (PostgreSQL, MongoDB, etc.). Explain tables/collections, how data is queried, what an ORM is (if used), list the actual models/tables in this project.

12. **Docker / Infrastructure** — If the project uses Docker, explain containers and docker-compose. If it uses a different setup, explain that. Show the actual commands to start the project.

13. **Authentication** — Whatever auth system is used. Explain the login flow, how tokens work, what roles/permissions exist. Reference the actual auth implementation.

#### Part 4: This Platform Specifically

14. **Project Architecture** — Full directory structure diagram, explain what each folder does, key files to know about, any important patterns (like dynamic routing, multi-tenancy, etc.)

15. **Design System / Components** (if applicable) — If the platform has a component library or design system, list every component, explain design tokens, show usage examples. If not, cover the UI patterns used.

16. **Features That Have Been Built** — Enumerate every major feature in the platform. For each: what it does, where the code lives (files), key technical details. This gives the reader a complete picture of the platform's current state.

#### Part 5: Workflows

17. **AI-Assisted Development** — How AI tools (Claude Code, etc.) are used in development, how to communicate effectively with AI (specific vs vague requests), what AI can and can't do, any specialized agents or skills configured for this project (check CLAUDE.md and .claude/ directory)

18. **Daily Workflows** — Step-by-step: how to start the dev environment, how to pull latest code, how to create a branch, pre-commit checks that must pass, how to create a PR, common commands reference table

19. **Glossary** — Define every technical term used in the tutorial. At least 30-50 terms. Sort alphabetically. Include both universal terms (API, Git, commit) and project-specific terms.

---

## Design Guidelines for the HTML

### Visual Style

- Use a clean, modern design with a neutral color palette
- Pick one accent color that matches the platform's brand (check for brand colors in the codebase — config files, CSS variables, Tailwind config)
- Use the Inter font (Google Fonts) or the project's actual font if there is one
- Light background (#fafafa or similar), dark text (#262626 or similar)
- Code blocks should have a dark background (#171717) with syntax coloring

### Components to Include

- **Sidebar** — Fixed left sidebar with table of contents, section headers, chapter links
- **Hero section** — Title, subtitle, date, reading time estimate
- **Code blocks** — Styled `<pre>` tags with colored spans for syntax highlighting
- **Callout boxes** — Info (blue), success (green), warning (yellow), danger (red) — with left border accent and background tint
- **Tables** — Clean, striped or hover-highlighted rows
- **Step indicators** — Numbered circles with content, for sequential instructions
- **Two-column layouts** — For comparisons (e.g., "Traditional CSS" vs "TailwindCSS")
- **ASCII diagrams** — Monospace text inside bordered boxes for architecture diagrams
- **Keyboard shortcut styling** — `<kbd>` tags for keyboard keys

### Technical Requirements

- Single self-contained HTML file (all CSS embedded in `<style>`, no external CSS files)
- Only external dependency allowed: Google Fonts link
- Responsive design (works on screens down to ~768px — hide sidebar, adjust padding)
- Print-friendly (@media print styles)
- Smooth scrolling between sections
- ~1500-2000 lines of HTML
- File size: ~60-100KB

---

## Tone and Writing Style

- **Conversational but professional** — Write like you're explaining to a smart friend, not writing a textbook
- **Use analogies** — "Git is like Google Docs version history for code", "Docker containers are like pre-configured mini virtual computers"
- **No jargon without explanation** — Every technical term must be defined the first time it appears
- **Show, don't just tell** — Every concept needs a code example or visual
- **Be honest about complexity** — Don't oversimplify to the point of inaccuracy. It's OK to say "this is complex, but here's what you need to know"
- **No emojis** — Keep it professional
- **Use "you" and "we"** — "You'll use Git daily" / "Our project uses FastAPI"

---

## Output

Save the tutorial as an HTML file in the project's documentation directory. Suggested names:

- `ONBOARDING_TUTORIAL.html`
- `docs/ONBOARDING_TUTORIAL.html`
- `design-docs/ONBOARDING_TUTORIAL.html`

Choose whichever location makes sense for this project's structure.

---

## Reference

This document was created based on a tutorial built for the Roofing8020 platform (a multi-client SaaS for real estate data). That tutorial covered Vue 3/Nuxt 4, TailwindCSS, FastAPI, PostgreSQL, Docker, Firebase Auth, and a custom design system called Axis. Your tutorial should follow the same depth and quality, but adapted entirely to whatever tech stack and features THIS platform uses.

The goal is the same: **if someone reads this tutorial front to back, they should go from knowing nothing about software development to understanding how this specific platform works and how to contribute to it.**
