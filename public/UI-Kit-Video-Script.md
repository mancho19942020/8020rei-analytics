# Building with Claude — Video Script

> **3:30 speaking + 0:30 product demo = 4:00 total.** `[SCROLL]` = scroll. Directions in brackets.

---

## INTRO — Hero

**[Hero visible]**

Hey everyone, Week 5. Today — the right way to work with Claude when building your product. You don't need to be a developer. You need to know **what to ask, in what order, and how to check if the result is good.** That's what this guide covers.

**[SCROLL]**

---

## The Right Order

**[Pyramid visible]**

Most important takeaway: **order matters more than speed.** Don't jump straight to "build me a dashboard" — that's decorating a house before pouring the foundation.

**[Point up the pyramid]** You start at the bottom. **Brand identity** — what does your product feel like? Then your **visual language** — specific colors, fonts, spacing rules. Then small **building blocks** — buttons, cards, inputs. Then you **combine them** into layouts. Only then do you build **full screens.**

When the foundation is solid, every new screen just snaps together. We built 8020 Lens this way — 15 building blocks, over 48 widgets, and they all look like they belong together.

**[SCROLL]**

---

## Step 1 — Your Identity

**[Cards visible]**

Before Claude writes any code, brief it on your brand — like briefing a designer. Tell it your colors, your font direction, your mood. "Deep navy blue, clean and professional, like Stripe." Decide if you want dark mode.

**[Point to prompt box]** Here's an example of what to say. You describe the product, the colors, the mood, and ask Claude to set up a design system. Ten minutes of thought here saves hours of inconsistency later.

**[SCROLL]**

---

## Step 2 — Build Your Pieces

**[Building blocks visible]**

Before any pages, ask Claude for small reusable pieces. A Button with variations — main, outline, subtle. A Card. An Input. **Three is enough to start.**

The key: tell Claude to use the colors and fonts from Step 1. That's what keeps everything consistent. And check each piece — does the button look clickable? Does it respond on hover? Fix small things now.

**[SCROLL]**

---

## Step 3 — Assemble & Add AI

**[Steps visible]**

Now put it together. **Describe what the user sees**, not how to code it. "A header, a sidebar, cards with metrics." Remind Claude to use your existing pieces.

Once the screen looks right, add the AI interaction — an input, a send button, a response card. Start simple, just make it work.

When something feels off, don't restart — describe the feeling: "Too cramped," "Header doesn't stand out." Claude gets it.

**[SCROLL]**

---

## Find References

**[Reference cards visible]**

Game-changer: **don't design from scratch.** Browse products you admire — Notion, Linear, Stripe. Screenshot what you like and tell Claude: "I want a sidebar like Notion's." The more specific your references, the better the result.

**[SCROLL]**

---

## Quality Check

**[Audit grid visible]**

You don't need to read code to check quality. Look for: **consistent colors** across all screens, **one or two fonts** max, **even spacing** that feels clean, **hover effects** on buttons, and **overall consistency** — every button, every card, same style everywhere. When something feels off, describe it to Claude in plain words.

**[SCROLL]**

---

## This Week

**[Checklist visible]**

Your game plan — seven steps in order. Set up your project with a CLAUDE.md. Define your brand and visual language. Build three building blocks. Assemble your first screen. Wire up one AI interaction. Do a quality check. Record a walkthrough.

**Foundation, blocks, screens, AI. Don't skip ahead.**

**[Pause — transition to product demo]**

Let me quickly show you what this looks like in practice...

**[Show 8020 Lens for ~30 seconds]**

---

> **Total: ~4 minutes** | Companion files: `uikit-guide.html` + `UI-Kit-Setup-Guide.md`
