# Sparkmatch: UI Redesign Spec ("Gamified & Vibrant")

> **Purpose:** a visual and interaction redesign of the existing frontend. Give this file to GitHub Copilot as context (`#file:ui-redesign.md`).
> **Supersedes:** `frontend-prd.md` Section 3 (Design system) and the colour lines in `prd.md` Section 7. **Everything else in both PRDs still applies**, especially the API contract (`prd.md` Section 9).

---

## 1. Ground rules (do not break)

1. **Visual and interaction changes only.** Do NOT touch `src/api/*`, `AuthContext`, routing paths, API field names (`full_name`, `match_score`, `shared_skills`, `complementary_skills`, `past_projects` ...), URLs, or form validation rules. No backend changes.
2. **No new API fields or endpoints.** All gamification (XP, levels, badges, quests, streaks) is computed on the client from existing data and stored in `localStorage`. It is cosmetic and per-browser; say so if asked.
3. **No swiping, chat or connection requests.**
4. **Tailwind CSS only.** No Bootstrap.
5. **Every existing feature keeps working** (acceptance checklist in `frontend-prd.md` Section 15 must still pass).
6. **Respect `prefers-reduced-motion`:** when set, disable confetti, tilt, floating and bouncing animations (keep simple fades).
7. **Readable colour pairs only:** dark text on bright backgrounds, white text only on violet / blue / black. Never put light text on yellow, green, orange, sky or pink.

---

## 2. Visual language: "playful neo-pop"

Chunky, friendly, game-like: thick dark outlines, hard offset shadows, rounded corners, bright colour blocks, big friendly type.

### 2.1 Palette

| Token | Hex | Used for |
|---|---|---|
| `ink` | `#0B0B0F` | All text, outlines, hard shadows |
| `cream` | `#FFF8E7` | Page background (with soft colour blobs) |
| `paper` | `#FFFFFF` | Cards |
| `spark` (brand green) | `#70E000` | Primary buttons, shared skills, XP bars, success |
| `spark-dark` | `#5CC100` | Hover/pressed green |
| `violet` | `#7C3AED` | Accents, level badges, Data/AI (white text) |
| `pink` | `#FF4D8D` | Design, highlights, hearts and likes |
| `orange` | `#FF8A00` | Hardware, streaks, warnings |
| `sun` | `#FFD60A` | Business, stars, badges, XP pops |
| `sky` | `#00C2FF` | Software, info, links |
| `blue` | `#3B82F6` | Research (white text) |
| `mist` | `#E5E7EB` | Other, disabled, empty slots |
| `danger` | `#E11D48` | Errors only |

### 2.2 Discipline colour coding (use everywhere a discipline appears)

| `discipline` value | Colour | Emoji |
|---|---|---|
| `hardware` | orange | 🔧 |
| `software` | sky | 💻 |
| `design` | pink | 🎨 |
| `business` | sun | 📈 |
| `data_ai` | violet | 🧠 |
| `research` | blue | 🔬 |
| `other` | mist | ✨ |

Create one helper `getDisciplineStyle(value)` returning `{ bg, text, emoji, label }`. Avatars, badges, card top-strips and "class" cards all use it.

### 2.3 Component styling

| Element | Style |
|---|---|
| Page | `bg-cream`, with 3 to 4 large blurred colour blobs (violet, pink, sky, sun at ~25% opacity) fixed in the background |
| Cards | `bg-white border-[3px] border-ink rounded-2xl shadow-[6px_6px_0_0_#0B0B0F]`; top colour strip (discipline colour); hover: lift by 2px and shadow grows to 8px |
| Buttons | Chunky: `border-[3px] border-ink rounded-xl font-extrabold shadow-[4px_4px_0_0_#0B0B0F]`; **pressed state** translates 3px down-right and shadow shrinks to 1px. Primary = `spark`, secondary = `sun`, tertiary = white |
| Inputs | `border-[3px] border-ink rounded-xl`, focus: `ring-4 ring-sky/60` |
| Chips | `rounded-full border-2 border-ink px-3 py-1 font-semibold`. **Shared skill = `spark`**, **complementary skill = `violet` with white text** (cycle `pink`, `sky`, `orange` for variety if a card lists many), interests = white with emoji |
| Navbar | White, `border-b-[3px] border-ink`, logo = ⚡ in a `spark` rounded square, level pill + XP bar visible on the right (Section 4.1) |
| Font | Headings: **"Baloo 2"** or **"Fredoka"** (Google Fonts), body: **Inter**; fallback `system-ui` |
| Radius and spacing | Generous: cards `rounded-2xl`, padding `p-5` to `p-6`, gaps `gap-6` |

### 2.4 Tailwind config

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0F", cream: "#FFF8E7", paper: "#FFFFFF",
        spark: "#70E000", "spark-dark": "#5CC100",
        violet: "#7C3AED", pink: "#FF4D8D", orange: "#FF8A00",
        sun: "#FFD60A", sky: "#00C2FF", blue: "#3B82F6", mist: "#E5E7EB",
        danger: "#E11D48",
      },
      fontFamily: { display: ["Baloo 2", "Fredoka", "system-ui", "sans-serif"], sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { pop: "6px 6px 0 0 #0B0B0F", "pop-sm": "4px 4px 0 0 #0B0B0F" },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
      },
      animation: { floaty: "floaty 4s ease-in-out infinite", wiggle: "wiggle 0.4s ease-in-out" },
    },
  },
  plugins: [],
};
```

**Allowed new dependencies** (install only these): `framer-motion` (animations), `canvas-confetti` (celebrations), `lucide-react` (already used).

---

## 3. Interaction principles

- Everything clickable reacts: hover lift, press-down, small wiggle on chips, ripple or bounce on success.
- Lists enter with a **staggered** fade/slide-up (`framer-motion`, 60 ms stagger).
- Numbers **count up** (match score, XP) over ~800 ms.
- Page changes use a quick fade/slide (200 ms).
- Success moments get **confetti** (registration complete, profile 100%, badge unlocked, level up). Cap at one burst per event.
- Floating **"+10 XP"** pops appear near the cursor/target and rise and fade (1 s).
- Loading states use colourful bouncing dots or skeleton cards with a shimmer, never a plain spinner.
- Empty states show the mascot (Section 4.6) with a friendly line.

---

## 4. Gamification system (client-side only)

### 4.1 XP, levels and the HUD

State lives in `src/gamification/GameContext.jsx`, persisted in `localStorage` under `sparkmatch_game_<profile_id>` (so each account has its own progress).

**Profile XP** (recomputed from the profile on every load/refresh):

| Item | XP |
|---|---|
| Each skill (max 10 counted) | 10 |
| Each interest (max 5 counted) | 5 |
| Bio filled | 15 |
| Experience summary filled | 20 |
| Each past project (max 3 counted) | 25 |
| GitHub URL | 15 |
| LinkedIn URL | 15 |

**Activity XP** (stored): daily first visit +10; viewing a profile for the first time +5 (once per profile id); opening an opportunity link for the first time +5 (once per opportunity id); completing a quest (4.3) +20.

`total_xp = profile_xp + activity_xp`

| Level | Name | Threshold |
|---|---|---|
| 1 | Spark Starter ⚡ | 0 |
| 2 | Igniter 🔥 | 80 |
| 3 | Flame 🌟 | 180 |
| 4 | Blaze 🚀 | 300 |
| 5 | Supernova 💥 | 450 |

**HUD (Navbar, right side):** level emoji + name, a thick green XP progress bar to the next level, and the streak flame (4.4). Clicking it opens the **Progress drawer** (level, XP breakdown, badges, quests). Level-ups trigger confetti and a modal "You reached {name}!".

### 4.2 Badges

Shown in the Progress drawer and on My Profile; locked ones appear greyed with a 🔒 and a hint.

| Badge | Emoji | Unlock rule |
|---|---|---|
| Hello World | 👋 | Account created |
| Power Collector | 🧩 | 5+ skills |
| Builder | 🛠️ | At least 1 past project |
| Networker | 🔗 | GitHub or LinkedIn added |
| Bridge Builder | 🌉 | Viewed profiles from 3 different disciplines |
| Explorer | 🧭 | Opened 5 different opportunities |
| Dream Team | 🏆 | Viewed a pair opportunity with `match_score` 100 |
| On Fire | 🔥 | 3-day streak |

Unlocking shows a toast with the badge, +confetti, and +10 XP.

### 4.3 Daily quests (Dashboard side panel)

Three quests with progress bars; each completion gives +20 XP once per day:
1. **Meet 3 new people:** view 3 different profiles.
2. **Scout 2 competitions:** open 2 different opportunity links.
3. **Level up your profile:** (if profile XP < 265) add anything missing; (otherwise) "Profile maxed 🎉" auto-complete.

Quest state resets daily (store the date string).

### 4.4 Streak
Count consecutive calendar days with a visit. Show 🔥 and the number in the HUD; orange flame bounces when the streak increases.

### 4.5 Where gamification touches existing data (no new API fields)
- **Profile completeness ring** on My Profile and Dashboard = `profile_xp / 265`.
- **Synergy meter** on `PersonCard` visualises `match_score` (Section 5.2).
- **Team slots** on `PairOpportunityCard` visualise `you_cover` / `they_cover` / `uncovered` (Section 5.4).

### 4.6 Mascot: "Sparky"
A friendly ⚡ character (inline SVG or emoji in a coloured circle) that appears on: login hero (floating), register steps (speech-bubble tips), empty states, level-up modal and loading screens. Keep tips short and cheerful ("Pick at least 2 skills to unlock your matches!").

---

## 5. Page redesigns

### 5.1 AuthPage (Login / Register)

- **Hero side (desktop):** huge display headline *"Great ideas need great teammates."* with the word "teammates" in a rotating colour highlight; floating coloured skill chips (Arduino, Python, Figma, Pitching, ML ...) drifting around Sparky. Three feature tiles in different colours: **Find your complement**, **Discover competitions**, **Build your dream team**.
- **Form side:** chunky card with pill-shaped Login / Register toggle (active = green).
- **Register as a quest map.** Replace the plain progress bar with a 4-node path (coloured circles connected by a line); completed nodes show ✓, the current node pulses. Step names and interactions (field names and payload unchanged):

| Step | Quest name | Interaction upgrade |
|---|---|---|
| 1 | "Create your hero" | Email/password; live password-strength bar (red → orange → green) |
| 2 | "Choose your class" | `discipline` becomes a **grid of big coloured cards** (emoji + label, from `/meta/disciplines/` and Section 2.2 colours), click to select with a pop animation; `experience_level` as three selectable cards: 🌱 Beginner, 🔥 Intermediate, 🚀 Advanced |
| 3 | "Pick your powers" | Skills/interests tag input with **colourful animated chips**; suggestions dropdown; a counter "3/2 skills ✓" that turns green when the minimum is met; Sparky tips |
| 4 | "Show your quests" | Experience summary, past projects as collectible "quest cards", optional links |

Each completed step shows a floating **+XP** pop (cosmetic). Final success: **confetti burst**, a "Welcome, {name}!" modal with the starting level and "Hello World 👋" badge, then redirect to `/dashboard`.

### 5.2 Dashboard

- **Top banner:** welcome message with the user's level, XP bar and streak, plus the profile-completeness ring.
- **Layout (desktop):** main column (people + opportunities) and a right sidebar with **Daily quests** and **Badges preview**. On mobile the sidebar becomes a collapsible section below the banner.
- **Discipline filter:** a row of coloured pill buttons (🔧 💻 🎨 📈 🧠 🔬 ✨, plus "All") instead of a dropdown; active pill is filled, others outlined.
- **PersonCard (upgraded):**
  - Coloured top strip and avatar in the person's discipline colour (initials), discipline badge with emoji.
  - **Synergy meter:** a circular ring that animates up to `match_score` (colour shifts: <50 orange, 50 to 79 sky, ≥80 green).
  - **Two-sided bar** "You | They": left segment = number of `shared_skills`, right segment = number of `complementary_skills`, labelled "You both know" and "They bring".
  - Shared skills green chips, complementary skills violet (or rotating) chips, the `reason` line in a speech bubble.
  - Hover: card tilts slightly (3D, ±4°) and chips wiggle; CTA button "View profile →".
- **OpportunityCard (upgraded):** type badge colours (hackathon = pink, competition = orange, project = sky, other = mist), prize shown with a 🏆 on a yellow ribbon, deadline with a colour-coded urgency chip (≤7 days red, ≤30 days orange, otherwise green), matched skills green, missing skills as dashed outlined chips with a ❓.
- Skeletons with shimmer; "Load more" button bounces gently.

### 5.3 ProfileDetailPage

- **Hero:** big colour banner in the discipline colour with a large avatar, name in display font, level-style badges (discipline + experience level).
- **"Skill overlap" visual:** two overlapping circles (Venn): left "You", right "{first name}", overlap contains shared skills (green), outer parts show each person's unique skills. This is computed on the client from `profile.skills` and the logged-in user's skills (case-insensitive).
- Past projects as colourful "quest cards"; contact links as icon buttons (✉️ GitHub LinkedIn) with hover pop.
- Viewing a profile for the first time shows a floating **+5 XP**.

### 5.4 "Opportunities for you two": Team slots

`PairOpportunityCard` renders a **party row** with one slot per entry in `required_skills`:
- Slot covered by you only → your avatar (your discipline colour) with the skill name underneath.
- Covered by them only → their avatar (their colour).
- Covered by both → both avatars overlapped.
- Not covered (`uncovered`) → dashed `mist` slot with ❓ and the skill name ("Still needed").
- Header shows "Team {covered}/{total} filled". When `uncovered` is empty: confetti once, a gold "Dream Team 🏆" ribbon, and the Dream Team badge check.

### 5.5 OpportunitiesPage and MyProfilePage
- Opportunities: colourful filter pills for `type`, animated card grid, search bar with a magnifier bounce.
- My Profile: completeness ring + level card + badge shelf at the top, edit form below with the same interaction upgrades as registration (class cards, chips). Saving shows confetti if the profile reaches 100% for the first time.

### 5.6 Misc
- 404 page: Sparky lost in space with "Wrong galaxy!" and a green "Back home" button.
- Toasts: coloured by type (success green, XP yellow, error red) with an emoji, slide in from bottom-right.

---

## 6. Folder additions

```
src/
├── gamification/
│   ├── GameContext.jsx        # xp, level, badges, quests, streak, localStorage
│   ├── rules.js               # xp formula, levels, badge rules (pure functions)
│   └── quests.js
├── styles/
│   └── disciplines.js         # getDisciplineStyle()
└── components/
    ├── HUD.jsx                # navbar level/xp/streak
    ├── ProgressDrawer.jsx
    ├── XPPop.jsx              # floating +XP
    ├── ConfettiBurst.jsx      # wraps canvas-confetti, honours reduced motion
    ├── Sparky.jsx             # mascot with speech bubble
    ├── SynergyRing.jsx
    ├── YouTheyBar.jsx
    ├── VennSkills.jsx
    ├── TeamSlots.jsx
    ├── ClassCard.jsx          # selectable discipline / level card
    ├── BadgeShelf.jsx
    └── QuestList.jsx
```

Existing components (`PersonCard`, `OpportunityCard`, `PairOpportunityCard`, `RegisterStepper`, ...) are **modified in place**, not renamed, and keep their props.

---

## 7. Acceptance checklist

- [ ] The old acceptance checklist (`frontend-prd.md` Section 15) still passes.
- [ ] `git diff` shows no changes in `src/api/` and no changed API field names.
- [ ] Palette, discipline colours and chip colours match Sections 2.1 to 2.3; text contrast stays readable.
- [ ] Register works as a 4-node quest map with class cards; payload sent to the API is unchanged.
- [ ] HUD shows level, XP bar and streak; level-up and badge unlocks celebrate once.
- [ ] Dashboard shows quests sidebar, coloured discipline pills, synergy rings and You | They bars.
- [ ] Profile detail shows the Venn overlap and Team slots on pair opportunities.
- [ ] Animations are disabled or simplified under `prefers-reduced-motion`.
- [ ] Mobile layout works (sidebar collapses, cards stack, HUD condenses to level emoji + bar).
- [ ] Only `framer-motion` and `canvas-confetti` were added as dependencies.
