# DESIGN.md — ZHomes TC Platform

> **ZHomes** is a private, mobile-first Transaction Coordinator (TC) platform for managing real estate closings in the United States. The UI serves three user roles: **TC (admin)**, **Broker/Realtor**, and **Client**. All views are optimized for mobile (375px–428px) with a WhatsApp-like chat-first experience. The visual language is premium, dark-capable, and real-estate institutional.

---

## Brand Identity

**Product name:** ZHomes TC Platform  
**Tagline:** Real estate closings, handled.  
**Audience:** Real estate professionals and clients in Kentucky, USA  
**Tone:** Professional, trustworthy, minimal friction. Never playful. Never childish.

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--zhomes-red` | `#E31E24` | Primary action, CTAs, active states, brand accent |
| `--zhomes-red-dark` | `#B81419` | Hover state for red buttons |
| `--zhomes-gold` | `#F5A623` | Secondary accent, premium badges, warnings |
| `--zhomes-gold-dark` | `#D4900E` | Hover state for gold elements |

**The red is the soul of the brand.** Every primary CTA, selected tab, active nav item, and brand moment uses `#E31E24`. The gold is reserved for premium or warning signals — use it sparingly.

---

## Typography

### Font Stack

```css
--font-display: 'Outfit', sans-serif;   /* Headlines, titles, hero text */
--font-body:    'Inter', sans-serif;    /* All body copy, labels, UI text */
```

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Use |
|---|---|---|
| `--text-xs` | `0.75rem` | Labels, badges, timestamps, eyebrows |
| `--text-sm` | `0.875rem` | Body copy, secondary text, form fields |
| `--text-base` | `1rem` | Default paragraph, card content |
| `--text-lg` | `1.125rem` | Subheadings, emphasized text |
| `--text-xl` | `1.25rem` | Section titles (mobile) |
| `--text-2xl` | `1.5rem` | Card headers, modal titles |
| `--text-3xl` | `1.875rem` | Page headings |
| `--text-4xl` | `2.25rem` | Hero headings (mobile) |
| `--text-5xl–7xl` | `3rem–4.5rem` | Desktop hero only |

### Font Weight Convention

- `400` — body text, descriptions
- `500` — secondary labels, metadata
- `600` — button labels, form labels
- `700` — card titles, section headers
- `800` — page h1, stat numbers, nav items
- `900` — hero titles, brand moments

### Section Eyebrow

Small all-caps label above section headings, always in `--zhomes-red`:
```css
.section-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--zhomes-red);
}
```

---

## Color System (Dual Theme)

### Light Theme (default)

```css
--bg-primary:   #F7F8FA   /* Page background */
--bg-secondary: #FFFFFF   /* Elevated surfaces, sidebars */
--bg-tertiary:  #F0F1F5   /* Subtle backgrounds, chips */
--bg-card:      #FFFFFF   /* Card, modal, panel backgrounds */

--text-primary:   #1A1F2E  /* Main text — near black, warm */
--text-secondary: #5A6178  /* Subtext, labels */
--text-tertiary:  #9CA3B8  /* Placeholders, timestamps, hints */

--border-subtle: #E8EAF0  /* Default card/input borders */
--border-medium: #D1D5E0  /* Stronger separators */
```

### Dark Theme (`[data-theme="dark"]`)

```css
--bg-primary:   #0A0C12              /* True near-black page background */
--bg-secondary: rgba(0,0,0,0.7)     /* Frosted dark surface */
--bg-card:      rgba(0,0,0,0.7)     /* Cards: dark glass */

--text-primary:   #E8EAF0  /* Off-white, warm */
--text-secondary: #9CA3B8
--text-tertiary:  #5A6178

--border-subtle: #2A2D3A
--border-medium: #3A3E4F
```

**Dark mode cards use glassmorphism:**
```css
backdrop-filter: blur(8px) saturate(151%);
border: 1px solid rgba(255, 255, 255, 0.125);
```

---

## Glassmorphism

Glass effects are used on sidebars, modals, sticky headers, and floating panels.

```css
/* Standard glass */
.glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.6));
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
}

/* Strong glass (modals, drawers) */
.glass-strong {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(30px);
  border: 1px solid var(--border-subtle);
}
```

In dark mode, glass uses dark-tinted surfaces:
```css
sidebar: rgba(22, 25, 35, 0.65)
border:  rgba(255, 255, 255, 0.06)
```

---

## Spacing

8-point grid system:

```
4px   8px   12px   16px   20px   24px   32px   40px   48px   64px   80px   96px
```

CSS tokens: `--space-1` (4px) through `--space-24` (96px)

**Mobile page padding:** `80px 16px 120px` — accounts for sticky top nav (64px) and bottom tab bar (80px + safe area).

---

## Border Radius

```css
--radius-sm:   6px    /* Tags, small chips */
--radius-md:   10px   /* Inputs, small buttons */
--radius-lg:   16px   /* Cards, panels */
--radius-xl:   24px   /* Modals, bottom sheets */
--radius-full: 9999px /* Pills, avatars, badges */
```

---

## Shadows

```css
--shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:   0 4px 12px rgba(0,0,0,0.08)
--shadow-lg:   0 8px 24px rgba(0,0,0,0.10)
--shadow-xl:   0 16px 48px rgba(0,0,0,0.12)

/* Card-specific */
--shadow-card:       0 2px 12px rgba(0,0,0,0.06)
--shadow-card-hover: 0 8px 30px rgba(0,0,0,0.12)

/* Brand glow effects */
--shadow-glow-red:  0 0 20px rgba(227, 30, 36, 0.15)
--shadow-glow-gold: 0 0 20px rgba(245, 166, 35, 0.20)
```

Dark mode shadows are significantly deeper (up to `rgba(0,0,0,0.6)`).

---

## Gradients

```css
--gradient-red:  linear-gradient(135deg, #E31E24 0%, #B81419 100%)
--gradient-gold: linear-gradient(135deg, #F5A623 0%, #E8960E 100%)
--gradient-dark: linear-gradient(135deg, #1A1F2E 0%, #2D3348 100%)

/* Spotlight hover effect for cards */
--gradient-spotlight: radial-gradient(ellipse at center, rgba(227,30,36,0.06), transparent 70%)
```

---

## Transitions

```css
--transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1)   /* Hover feedback */
--transition-base:   250ms cubic-bezier(0.4, 0, 0.2, 1)   /* Default */
--transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1)   /* Panels, drawers */
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy modals */
```

Bottom sheet entry: `slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards`

---

## Components

### Cards

Standard card surface:
```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);   /* 16px */
box-shadow: var(--shadow-card);
transition: all var(--transition-base);
```
On hover: `translateY(-2px)` + `shadow-card-hover`.  
Cards with left-border emphasis use a 3px colored left border for priority states.

### Buttons

**Primary (red):**
```css
background: linear-gradient(135deg, #E31E24, #B81419);
color: white;
border-radius: 10px;
font-weight: 700;
padding: 12px 24px;
```
Hover: `translateY(-1px)` + red glow.

**Secondary (ghost):**
```css
border: 1px solid var(--border-medium);
background: transparent;
color: var(--text-primary);
```

**Destructive (delete/danger):**
```css
background: rgba(239, 68, 68, 0.08);
border: 1px solid rgba(239, 68, 68, 0.2);
color: #E31E24;
border-radius: 12px;
```

**Full-width mobile CTA:** `width: 100%; padding: 13–14px; border-radius: 12px; font-weight: 700`

### Badges / Pills

```css
border-radius: var(--radius-full);
font-size: 0.75rem;
font-weight: 600;
padding: 2px 10px;
```

| Variant | Background | Text |
|---|---|---|
| Red (brand) | `rgba(227,30,36,0.08)` | `#E31E24` |
| Gold (premium) | `rgba(245,166,35,0.10)` | `#C78400` |
| Success | `rgba(16,185,129,0.08)` | `#059669` |
| Warning | `rgba(245,158,11,0.08)` | `#D97706` |
| Info | `rgba(59,130,246,0.08)` | `#2563EB` |

### Inputs / Forms

```css
background: var(--bg-secondary);
border: 1px solid var(--border-subtle);
border-radius: 10–12px;
padding: 12px 16px;
font-size: 0.9rem;
```
Focus ring: `border-color: #E31E24; box-shadow: 0 0 0 3px rgba(227,30,36,0.08)`

### Avatar / Initials

Circular or rounded-square (10px radius) container:
```css
background: var(--bg-secondary);
color: var(--text-secondary);
font-weight: 800;
font-size: 0.9rem;
width: 36–40px;
height: 36–40px;
```

---

## Mobile Navigation

### Top Bar (sticky)
```
height: 64px
background: var(--bg-glass) + backdrop-filter: blur(20px)
border-bottom: 1px solid var(--border-subtle)
padding-top: env(safe-area-inset-top)
```

### Bottom Tab Bar (sticky)
```
height: 60–80px
background: glass
padding-bottom: env(safe-area-inset-bottom)
z-index: 1000
```

### Tab Pills (horizontal scroll)
```css
overflow-x: auto;
-webkit-overflow-scrolling: touch;
scroll-snap-type: x mandatory;
/* hide scrollbar */
::-webkit-scrollbar { display: none; }
```

Active tab: `border-bottom: 2px solid var(--zhomes-red); color: var(--text-primary)`

---

## Mobile Layout Patterns

### Bottom Sheet / Modal
```
position: fixed; inset: 0
background: rgba(0,0,0,0.6); backdrop-filter: blur(5px)
z-index: 2000
animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)
border-radius: 24px 24px 0 0
max-height: 88vh
```

### Chat Bubbles (Deal Room)
- **Others:** `background: var(--bg-secondary)`, left-aligned, `border-bottom-left-radius: 2px`
- **Mine:** `background: var(--zhomes-red); color: white`, right-aligned, `border-bottom-right-radius: 2px`
- Max-width: `80%`

### Pipeline Columns (CRM)
Vertical stacked columns with header strip:
```css
background: var(--bg-secondary);   /* header */
border-left: 3px solid var(--stage-color);  /* optional emphasis */
border-radius: 16px;
```

---

## Status / Semantic Colors

| Concept | Color |
|---|---|
| Success / Approved | `#10B981` (emerald) |
| Warning / Pending | `#F59E0B` (amber) |
| Danger / Cancelled | `#E31E24` (zhomes-red) |
| Info / In Review | `#3B82F6` (blue) |
| Transferred | `#3B82F6` (blue, 0.08 bg tint) |
| Neutral / Default | `#6B7280` (gray) |

---

## Iconography

All icons use **Lucide React** (`lucide-react`). No emojis in the UI.  
Icon size convention: `16px` (inline), `18–20px` (buttons/nav), `24px` (headers), `32–48px` (empty states).

```jsx
import { FileText, MessageCircle, Upload, CheckCircle2 } from 'lucide-react'
```

---

## Animation Library

| Name | Use |
|---|---|
| `fadeIn` | Page/section load |
| `fadeInUp` | Card and list entry (30px offset) |
| `fadeInScale` | Modal/popover appear (scale from 0.9) |
| `slideInLeft/Right` | Panel transitions |
| `shimmer` | Skeleton loading states |
| `pulse` | Notification dots, live indicators |
| `float` | Decorative elements (8px vertical) |
| `glow` | Brand CTA elements |
| `slideUp` | Bottom sheet entry |

Stagger delays: `.delay-1` through `.delay-8` at 0.1s increments.

---

## Layout Structure

### Desktop Dashboard
```
┌─────────────────────────────────────┐
│  Sidebar (260px) │  Main Content     │
│                  │  max-width: 1400px│
└─────────────────────────────────────┘
```
Sidebar collapses to `72px` (icon-only mode).

### Mobile (primary target)
```
┌─────────────────┐
│  Top Nav 64px   │ ← sticky glass bar
├─────────────────┤
│                 │
│  Page Content   │ ← scrollable
│  padding:       │
│  80px 16px 120px│
│                 │
├─────────────────┤
│  Bottom Tabs    │ ← sticky, ~60–80px
└─────────────────┘
```

---

## Roles & UI Context

| Role | Interface |
|---|---|
| **TC (admin)** | Full desktop + mobile dashboard. Access to all transactions, CRM, settings |
| **Broker/Realtor** | Mobile portal. Deal Room with tabs: Checklist, Chat, Detalles, AI |
| **Client** | Mobile only. Chat-first (WhatsApp mode). No tabs visible. Has `[+]` button for document upload |

---

## Do / Don't

**Do:**
- Use `font-weight: 800–900` for any number or metric that matters
- Add `translateY(-2px)` hover lifts on interactive cards
- Use `var(--zhomes-red)` for every primary action — no exceptions
- Use `border-radius: 16px` for cards and `24px` for modals
- Include `Reply STOP to opt out` in every SMS copy

**Don't:**
- Use emojis in the UI (use Lucide icons instead)
- Use generic system fonts (always load Inter + Outfit)
- Use plain red/blue/green — use the semantic token system
- Add more than 2 font families
- Use `z-index` values above `2000` (reserved for modals)

---

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Vanilla CSS (component-scoped `.css` files) + `index.css` global tokens
- **Icons:** `lucide-react`
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **SMS:** Twilio A2P 10DLC (Messaging Service `MG1f643d...`)
- **Push:** Firebase Cloud Messaging (FCM)
- **AI:** OpenAI GPT-4 via `/api/zhomes-ai`
