# Building with Claude — UI Kit Guide

**How to guide Claude to build your product the right way.**

You don't need to be a developer to build something great. You need to know what to ask for, in what order, and how to tell if the result is good.

---

## 1. The Right Order

The #1 mistake is telling Claude "build me a dashboard" right away. That's like decorating a house before pouring the foundation. Instead, work in layers — each one supports the next.

```
        ┌──────────────────┐
    5   │  Full Screens     │  Your dashboard, login, settings
        ├──────────────────────────┤
    4   │  Sections & Layouts      │  Headers, sidebars, forms
        ├──────────────────────────────────┤
    3   │  Building Blocks                 │  Buttons, cards, inputs, menus
        ├──────────────────────────────────────────┤
    2   │  Visual Language                         │  Colors, fonts, spacing, shadows
        ├──────────────────────────────────────────────────┤
    1   │  Brand Identity                                  │  Mood, colors, personality
        └──────────────────────────────────────────────────┘
```

**Why this order?** When the bottom layers are solid, every new screen becomes assembly — just arranging pieces that already look great together. Skip a layer, and every new feature becomes a fight with mismatched colors, inconsistent fonts, and things that feel "off."

---

## 2. Step 1 — Tell Claude Who You Are

Before Claude writes a single line of code, brief it on your brand. Think of it like briefing a designer — the clearer the brief, the better the result.

**What to decide (you don't need to be technical):**

| Decision | What to think about |
|----------|-------------------|
| **Colors** | Pick a primary brand color and 1-2 accents. Describe them: "a deep navy blue," "warm coral, like Airbnb's orange." |
| **Font** | Modern and clean? Elegant and editorial? Just tell Claude the vibe. |
| **Dark mode?** | Decide upfront — light, dark, or both. Adding it later is much harder. |
| **Mood** | Serious and professional? Fun and playful? Minimal and calm? This guides every visual decision. |

**What to tell Claude:**

> "I'm building a [type of product]. The brand uses [color description] as the main color. The mood should feel [professional / playful / minimal / bold]. I want to support [light / dark / both] mode. Please set up my project with a design system — define all the colors, fonts, and spacing as a visual language that every part of the app will follow."

**Why this matters:** If you skip this and go straight to "build me a page," Claude will pick random colors and fonts each time. Your app ends up looking like five different products glued together.

---

## 3. Step 2 — Build Your Pieces First

Before building pages, ask Claude to create small, reusable pieces — your building blocks. Every screen you build later will use them.

**Common building blocks (you only need 3-5 to start):**

`Button` · `Card` · `Text Input` · `Navigation Tabs` · `Dropdown` · `Toggle Switch` · `Table` · `Modal/Popup` · `Tag/Badge` · `Loading Skeleton` · `Tooltip` · `Alert/Callout`

**What to ask for with each block:**
- **Multiple variations** — A main button, an outline button, a subtle button. Small, medium, large.
- **Consistent styling** — Tell Claude: "Use the colors and fonts from the design system we set up."
- **Independence** — Each piece should work on its own, usable anywhere.
- **Test each one** — Does the button look clickable? Does it respond on hover? Fix small things now.

**What to tell Claude:**

> "Create a set of reusable building blocks using our design system. Start with: a Button (with filled, outlined, and subtle styles in small/medium/large sizes), a Card (with a title, content area, and subtle shadow), and a Text Input (with a label, placeholder, and error state). They should all use the same colors and fonts, and work in [light / dark / both] mode."

**Start small** — 3 blocks is enough for this week. Add more as your product needs them.

---

## 4. Step 3 — Assemble Your Screens

With your identity defined and blocks ready, now tell Claude to put them together.

**How to guide Claude:**

| Do this | Not this |
|---------|----------|
| Describe what the user sees | Don't describe how to code it |
| "A header with my product name and navigation" | "Create a flex container with..." |
| "Cards showing key metrics in a clean grid" | "Map over an array and render..." |
| "Use the Button and Card we already built" | Don't let Claude create new random elements |

**The assembly process:**

1. **Describe the screen** — "A clean dashboard with a header at the top, navigation on the side, and cards with key metrics in the main area."
2. **Remind Claude to reuse your pieces** — "Use the Button, Card, and Input components we already built."
3. **Add the AI interaction** — "Add a text input where users type a question, a send button, and a card that shows the AI response."
4. **Refine by describing feelings** — Don't restart. Say: "The spacing feels too tight," or "The header doesn't stand out enough." Claude understands this.

**What to tell Claude:**

> "Build the main screen of my app. It should have a header with my product name and a navigation bar, and the main area shows [what the user sees]. Use the components we created. Make it feel [clean / spacious / professional] and follow our design system."

---

## 5. Find References — Don't Design from Scratch

The best products aren't invented from nothing — they're inspired. Before building something, find examples and bring them to Claude.

**The reference workflow:**

1. **Browse products you admire** — How does Notion handle navigation? How does Linear display a dashboard? How does Stripe handle forms?
2. **Explore design galleries** — Dribbble, Mobbin, Godly. Search for your type of product.
3. **Tell Claude what you found** — "I like how Notion uses a clean sidebar with icons," or "I want cards similar to Linear's dashboard."
4. **Describe the UX, not just the look** — "Smooth hover transitions," "The page should feel spacious."

**What to tell Claude:**

> "For the navigation, I want something similar to Notion's sidebar — clean, with icons next to each item. For the content area, I like how Linear shows cards — minimal, lots of white space, subtle shadows on hover. Follow these references while using our design system."

---

## 6. Quality Check — How to Tell If It's Built Well

You don't need to read code. Here's what to check visually:

### Color Consistency
- Same brand color used everywhere for primary actions?
- No random colors that don't belong to your palette?
- Dark mode looks intentional, not just inverted?

### Typography
- Only 1-2 fonts across the whole app?
- Headlines clearly bigger than body text?
- Text is easy to read — not too small, not too light?

### Spacing & Alignment
- Elements feel evenly spaced — nothing cramped?
- Cards, buttons, and inputs aligned properly?
- The page has "room to breathe"?

### Interactions
- Buttons change on hover — visual feedback?
- Clickable things look clickable?
- Transitions feel smooth, not jumpy?

### Consistency
- All buttons look the same style across pages?
- Cards have the same shadow and shape?
- Navigation identical on every screen?

### Usability
- Layout makes sense — user knows where to look?
- Most important content is the most visible?
- A new user could figure out what to do?

**When something feels off, describe the feeling to Claude:**
"The buttons feel too small." "There's too much empty space on the right." "The cards don't feel connected to each other." You don't need technical words.

---

## 7. Your Week 5 Game Plan

Follow this order. Broken parts are fine — the goal is a working skeleton.

- [ ] **Set up your project + CLAUDE.md** — Ask Claude to scaffold your project and create a CLAUDE.md that describes your stack and rules. This makes Claude smarter in every future conversation.
- [ ] **Define your brand identity + visual language** — Tell Claude your colors, fonts, mood. Ask for a design system.
- [ ] **Build 2-3 building blocks** — Button, Card, Input with variations. Check they match your brand.
- [ ] **Assemble your first screen** — A header, main area, your content. Using the blocks you created.
- [ ] **Wire up one AI interaction** — User types something -> AI responds -> result shows on screen.
- [ ] **Quality check** — Use the audit checklist above. Fix what feels off.
- [ ] **Record a walkthrough** — Screen recording showing your progress.

### The Golden Rule

**Foundation -> Blocks -> Screens -> AI.** Don't skip ahead. Each step makes the next one easier. Trust the process.

---

*Built for Week 5 — The right order, the right quality.*
*Reference: 8020 Lens — Axis Design System*
