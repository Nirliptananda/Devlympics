# Sparkmatch: Frontend PRD (for Lovable)

> **Companion to `prd.md`.** That document is the master spec. This one tells the frontend builder (Lovable) exactly what to build on the client side.
> **If anything here ever conflicts with `prd.md` Section 9 (API Contract), `prd.md` wins.**
> **Hackathon theme:** Bridge the Gap | **Build window:** 4 hours | **Version:** 1.0

---

## 0. Instructions to Lovable (read first)

You are building **only the frontend** of Sparkmatch, a web app that connects people from different disciplines. A separate Django REST backend is being built by someone else. Follow these rules strictly:

1. **Do NOT use Supabase, Firebase or any built-in backend.** Do not create database tables. All data comes from the REST API described in Section 7 (or from the mock layer in Section 12 until the backend is ready).
2. **Do NOT rename, restructure or "improve" any API field, URL or enum value.** Use them exactly as written. Keys are `snake_case`. Every URL ends with a trailing slash.
3. **No swiping, no chat, no connection requests.** People discover each other through recommendation lists and profile pages only.
4. **Use Tailwind CSS only for styling.** Do not install or import Bootstrap (it clashes with Tailwind).
5. **Theme:** white background, black text, `#70e000` green for buttons and accents. See Section 3. Never put green text on a white background.
6. **Mock mode must be ON by default** (`VITE_USE_MOCKS=true`) so the app is fully demoable inside Lovable's preview. Switching to the real backend must require changing **only environment variables**, with no code changes.
7. Prefer plain JavaScript/JSX. If Lovable generates TypeScript, that is acceptable as long as every API field name stays identical.
8. Build in the order given in Section 14 and keep each step working before moving on.

---

## 1. Product summary

Sparkmatch lets people register with their discipline, skills, past projects and interests. The app then recommends:

- **People** who share *some* of your skills (so you can communicate) but bring *different* skills you lack (so you complement each other).
- **Opportunities** (hackathons, competitions, open projects, e.g. from Unstop) that fit your skills, plus opportunities where **you and a specific recommended person together** cover the required skills.

> **Tagline:** Every great project starts with a spark. Find the people who make it catch.

### Frontend scope

| ID | Feature | Priority |
|---|---|---|
| F1 | Register (4-step form, one API call) | **P0** |
| F2 | Login / logout / token handling | **P0** |
| F3 | Landing page = Login/Register | **P0** |
| F4 | Dashboard: recommended people | **P0** |
| F5 | Dashboard: recommended opportunities | **P0** |
| F6 | Profile detail with "Opportunities for you two" | **P0** |
| F8 | My profile view and edit | P1 |
| F9 | Browse and filter all opportunities | P1 |
| F10 | Filter recommended people by discipline | P1 |

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | React (Vite) |
| Styling | Tailwind CSS (+ plain HTML/CSS where needed) |
| Routing | `react-router-dom` |
| HTTP | `axios` |
| Forms | Controlled components with `useState` (no form library required) |
| Icons | `lucide-react` |
| Font | Inter (Google Fonts) with `system-ui, sans-serif` fallback |

**Environment variables**

| Variable | Default (Lovable preview) | Real integration |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | same |
| `VITE_USE_MOCKS` | `true` | `false` |

---

## 3. Design system

**Overall look:** clean, spacious, modern. White canvas, black type, bright green actions.

| Token | Value | Usage |
|---|---|---|
| `paper` | `#ffffff` | Page, navbar and card backgrounds |
| `ink` | `#000000` | All body text, headings, icons, borders, focus rings |
| `spark` | `#70e000` | Primary buttons, active tab underline, shared-skill chips, match badge, progress bar, logo badge |
| `spark-dark` | `#5cc100` | Hover and pressed state of green elements |
| `muted` | `#f4f4f5` / `#6b7280` | Light grey section backgrounds, secondary text (use sparingly; keep main text black) |
| `danger` | `#b91c1c` | Error text and error borders only |

**Tailwind config**
```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { spark: "#70e000", "spark-dark": "#5cc100", ink: "#000000", paper: "#ffffff" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
```

**Component styling rules**

| Element | Style |
|---|---|
| Page | `bg-white text-black` |
| Navbar | White background, black text, `border-b border-black`; logo is a small green rounded square with ⚡ plus the word **Sparkmatch** in bold black |
| Primary button | `bg-spark text-black font-semibold rounded-lg px-5 py-2.5 hover:bg-spark-dark`; disabled state: 50% opacity, `cursor-not-allowed` |
| Secondary button | White background, `border border-black text-black`, hover `bg-black text-white` |
| Inputs | White background, `border border-black rounded-lg`, focus `ring-2 ring-spark ring-offset-1` |
| Cards | `bg-white border border-black/15 rounded-2xl shadow-sm hover:shadow-md`, padding 20 to 24px |
| Links | Black, underlined; hover shows a green underline |
| Active nav item | Black text with a 3px `spark` underline |
| Match badge | Pill: `bg-spark text-black font-bold`, text like `82% match` |
| **Shared-skill chip** | `bg-spark text-black` (rounded-full, small) |
| **Complementary-skill chip** | `bg-black text-white` (rounded-full, small); this is the one place white text is used, to make "different skills" pop |
| Neutral chip (interests, other skills) | `bg-white border border-black text-black` |
| Error banner | White background, `border border-danger text-danger`, rounded-lg |

**Hard rules:** never use `#70e000` as a text colour on white (poor contrast). Green is always a *background* with black text. No other accent colours.

---

## 4. Routes and access control

| Route | Page | Access |
|---|---|---|
| `/` | Redirect: logged in → `/dashboard`, else → `/login` | Public |
| `/login` | **AuthPage** (Login tab active). This is the landing page | Public only |
| `/register` | **AuthPage** (Register tab active, shows the stepper) | Public only |
| `/dashboard` | Recommended people and opportunities | Protected |
| `/people/:id` | Profile detail and pair opportunities | Protected |
| `/opportunities` | Browse and filter all opportunities (P1) | Protected |
| `/me` | My profile, view and edit (P1) | Protected |
| `*` | Simple "Page not found" with a button back to `/` | Public |

- **Public only:** if a valid token exists, redirect to `/dashboard`.
- **Protected:** if there is no token, redirect to `/login`.
- On app load, if a token exists in storage, call `GET /auth/me/` to validate it and load the current profile. Show a full-screen loader meanwhile. On failure, clear the token and go to `/login`.

---

## 5. Folder structure

```
src/
├── main.jsx
├── App.jsx                      # router + providers
├── index.css                    # tailwind directives + font import
├── api/
│   ├── client.js                # axios instance + interceptors
│   ├── index.js                 # picks mock or real implementation
│   ├── real.js                  # real API calls (Section 7)
│   ├── mock.js                  # mock implementation (Section 12)
│   └── errors.js                # normalizeError()
├── mocks/
│   ├── profiles.json
│   ├── opportunities.json
│   └── lookups.json
├── context/
│   └── AuthContext.jsx
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── PublicOnlyRoute.jsx
│   ├── TagInput.jsx
│   ├── PastProjectsField.jsx
│   ├── RegisterStepper.jsx
│   ├── LoginForm.jsx
│   ├── PersonCard.jsx
│   ├── OpportunityCard.jsx
│   ├── PairOpportunityCard.jsx
│   ├── SkillChip.jsx
│   ├── MatchBadge.jsx
│   ├── FormField.jsx
│   ├── ErrorBanner.jsx
│   ├── Loader.jsx
│   └── EmptyState.jsx
├── pages/
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProfileDetailPage.jsx
│   ├── OpportunitiesPage.jsx
│   ├── MyProfilePage.jsx
│   └── NotFoundPage.jsx
└── utils/
    └── skills.js                # normalize(), intersect(), difference()
```

---

## 6. Global API conventions (copied from `prd.md` Section 9.1; do not deviate)

| Topic | Rule |
|---|---|
| Base URL | `VITE_API_BASE_URL` (ends with `/api/v1`). All paths below are relative to it and **end with `/`** |
| Format | JSON in and out; `Content-Type: application/json` |
| Keys | `snake_case` in requests and responses |
| Auth header | `Authorization: Token <token>` on every call except register, login, `meta/*`, `skills/`, `interests/` |
| Token storage | `localStorage` key `sparkmatch_token` |
| Skills / interests in a **profile** | Arrays of plain **strings** |
| Empty optional strings | `""`, never `null`. Only `deadline` may be `null` |
| Pagination envelope | `{ "count": n, "next": url|null, "previous": url|null, "results": [] }`, `?page=`, `?page_size=` (default 10, max 50) |
| Error shape | `{ "detail": "message", "errors": { "field": ["msg"] } }` (`errors` only on 400) |

**Enums (exact values)**

| Enum | Values |
|---|---|
| `discipline` | `hardware`, `software`, `design`, `business`, `data_ai`, `research`, `other` |
| `experience_level` | `beginner`, `intermediate`, `advanced` |
| `opportunity.type` | `competition`, `hackathon`, `project`, `other` |
| `opportunity.mode` | `online`, `offline`, `hybrid` |

Labels for `discipline`: Hardware / Electronics, Software, Design, Business / Marketing, Data / AI, Research, Other. Always fetch dropdown options from `GET /meta/disciplines/` and `GET /meta/experience-levels/` (the mock layer serves the same lists).

---

## 7. API layer (`src/api`)

### 7.1 `client.js`
```js
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("sparkmatch_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = url.includes("/auth/login/") || url.includes("/auth/register/");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("sparkmatch_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
export default client;
```

### 7.2 Function list (identical signature in `real.js` and `mock.js`)

`src/api/index.js` exports one object chosen by `VITE_USE_MOCKS`. Pages and components import **only** from `src/api`, never from axios directly.

| Function | HTTP call | Returns |
|---|---|---|
| `register(payload)` | `POST /auth/register/` | `{ token, user, profile }` |
| `login({ email, password })` | `POST /auth/login/` | `{ token, user, profile }` |
| `logout()` | `POST /auth/logout/` | nothing (204) |
| `getMe()` | `GET /auth/me/` | `{ user, profile }` |
| `getMyProfile()` | `GET /profiles/me/` | Profile |
| `updateMyProfile(partial)` | `PATCH /profiles/me/` | Profile |
| `getProfile(id)` | `GET /profiles/{id}/` | Profile |
| `getDisciplines()` | `GET /meta/disciplines/` | `[{value,label}]` (plain list) |
| `getExperienceLevels()` | `GET /meta/experience-levels/` | `[{value,label}]` (plain list) |
| `searchSkills(search, limit=10)` | `GET /skills/?search=&limit=` | `[{id,name,category}]` (plain list) |
| `searchInterests(search, limit=10)` | `GET /interests/?search=&limit=` | `[{id,name}]` (plain list) |
| `getRecommendedProfiles({discipline, page, page_size})` | `GET /recommendations/profiles/` | paginated `{ profile, match_score, shared_skills, complementary_skills, shared_interests, reason }` |
| `getRecommendedOpportunities({type, page, page_size})` | `GET /recommendations/opportunities/` | paginated `{ opportunity, match_score, matched_skills, missing_skills }` |
| `getPairOpportunities(profileId, {page, page_size})` | `GET /recommendations/pair/{profile_id}/opportunities/` | paginated `{ opportunity, match_score, you_cover, they_cover, uncovered }` |
| `listOpportunities({type, source, skill, search, page, page_size})` | `GET /opportunities/` | paginated Opportunity |
| `getOpportunity(id)` | `GET /opportunities/{id}/` | Opportunity |

Omit query params that are empty or undefined.

### 7.3 Object shapes (frontend must read exactly these fields)

**Profile (full)**: `id, email, full_name, discipline, discipline_label, experience_level, bio, experience_summary, skills[string], interests[string], past_projects[{id,title,description,link}], github_url, linkedin_url, created_at`

**ProfileSummary** (inside recommendations): `id, full_name, discipline, discipline_label, experience_level, bio, skills[string], interests[string]`

**Opportunity**: `id, title, type, source, organizer, url, description, prize, mode, deadline (YYYY-MM-DD|null), image_url, required_skills[string], created_at`

### 7.4 Register payload (exact keys)

```json
{
  "email": "", "password": "",
  "full_name": "", "discipline": "", "experience_level": "", "bio": "",
  "experience_summary": "",
  "skills": [], "interests": [],
  "past_projects": [{ "title": "", "description": "", "link": "" }],
  "github_url": "", "linkedin_url": ""
}
```
`confirm_password` exists **only in the UI** and must never be sent.

### 7.5 Error handling (`errors.js`)

`normalizeError(err)` returns `{ detail: string, fieldErrors: { [field]: string } }`:
- Take `err.response?.data?.detail` (fallback: "Something went wrong. Please try again.").
- If `errors` exists, convert each `field: [msg, ...]` to `field: msg[0]`.
- If there is no `err.response` (network down): `detail = "Cannot reach the server. Check your connection."`

Usage: field errors render under the matching input (red text); `detail` renders in an `ErrorBanner` above the form.

---

## 8. State management

**`AuthContext`** provides `{ user, profile, token, loading, loginUser(creds), registerUser(payload), logoutUser(), refreshProfile() }`.

- `loginUser` / `registerUser`: call the API, save `token` to `localStorage` (`sparkmatch_token`), set `user` and `profile`, navigate to `/dashboard`.
- `logoutUser`: call `logout()` (ignore failures), remove token, clear state, navigate to `/login`.
- `refreshProfile`: re-fetch `getMe()` (used after editing profile).
- Page-level data (recommendations, opportunities) uses local `useState` + `useEffect`; no global store needed.

---

## 9. Pages in detail

### 9.1 AuthPage (`/login`, `/register`)

**Layout (desktop):** two columns. Left (hidden on mobile): large black headline *"Great ideas don't fail from lack of talent. They fail from missing teammates."* with a short line below and a row of three feature blurbs (Find your complement, Discover competitions, Build as a team). Right: a white card with two tabs, **Login** and **Register**. The active tab has a 3px green underline. Switching tabs changes the route between `/login` and `/register`.

**Login form**
| Field | Rules |
|---|---|
| Email | required, valid email format |
| Password | required; show/hide eye toggle |
Button: **"Log in"** (green, full width, shows spinner while loading). Below: *"New here? Create an account"* switches to the Register tab.
Also show a small hint box in mock mode only: *"Demo account: demo@sparkmatch.app / Demo@1234"*.
`401` → `ErrorBanner` with the response `detail` ("Invalid email or password.").

**Register: `RegisterStepper` (4 steps, one API call at the end)**

A green progress bar and "Step X of 4" label at the top. **Next** validates the current step only. **Back** keeps entered data. Data from all steps lives in one state object. Only the final **"Create my account"** sends the request.

| Step | Fields (name → payload key) | Validation |
|---|---|---|
| **1. Account** | Email → `email`; Password → `password`; Confirm password (UI only) | Valid email; password ≥ 8 chars; confirm matches |
| **2. About you** | Full name → `full_name`; Discipline (select from `/meta/disciplines/`) → `discipline`; Experience level (select from `/meta/experience-levels/`) → `experience_level`; Short bio (textarea, optional) → `bio` | Name required; discipline and level required |
| **3. Skills and interests** | Skills (`TagInput`) → `skills`; Interests (`TagInput`) → `interests` | **≥ 2 skills**, **≥ 1 interest** |
| **4. Experience** | Experience summary (textarea) → `experience_summary`; Past projects (`PastProjectsField`) → `past_projects`; GitHub URL → `github_url`; LinkedIn URL → `linkedin_url` | Summary required; each added project needs title + description; URLs must be valid if non-empty |

- If the API returns `400` with `errors`, show the messages under the right fields. If a field belongs to an earlier step (e.g. `email`), jump back to that step.
- Success: AuthContext saves the token and redirects to `/dashboard`.

### 9.2 DashboardPage (`/dashboard`)

1. **Greeting:** "Welcome, {first name}" with a one-line subtitle: *"Here are people who complement your skills, and competitions you could win together."*
2. **Section "People you should meet"**
   - Fetch `getRecommendedProfiles({ page: 1, page_size: 6 })`.
   - Grid of `PersonCard` (1 column mobile, 2 tablet, 3 desktop).
   - P1: discipline filter dropdown ("All disciplines" + options) that re-fetches with `discipline=`.
   - **"Load more"** button (secondary) appears while `next` is not null and fetches the next page, appending results.
3. **Section "Opportunities for you"**
   - Fetch `getRecommendedOpportunities({ page: 1, page_size: 6 })`.
   - Grid of `OpportunityCard` with matched and missing skills.
   - P1: link "View all opportunities →" to `/opportunities`.
4. Each section has its own loading skeleton, empty state and error state with a **Retry** button.

### 9.3 ProfileDetailPage (`/people/:id`)

- Fetch `getProfile(id)` and `getPairOpportunities(id)`. `404` → "Profile not found" empty state. `400` (own profile) → redirect to `/me`.
- **Header card:** avatar circle with initials (green background, black text), full name, discipline badge, experience-level badge, bio.
- **Contact:** email (as `mailto:` link), plus GitHub and LinkedIn links if non-empty (open in a new tab). Hide empty ones.
- **Skills:** compute against the current user's skills (case-insensitive): skills the viewer also has render as **shared (green)** chips; others as **complementary (black)** chips. Show a one-line legend: green = "You both have this", black = "They bring this".
- **Interests:** neutral chips; shared interests get a green chip.
- **Experience:** `experience_summary` paragraph.
- **Past projects:** list of cards (title, description, link button if present).
- **Section "Opportunities for you two"** (the signature feature): list of `PairOpportunityCard`. Empty state: *"No competitions found where you both are needed yet."*

### 9.4 OpportunitiesPage (`/opportunities`, P1)
- Filters: search text (debounced 400 ms), type select (All / Competition / Hackathon / Project / Other), optional source select.
- Calls `listOpportunities` with the filters, page-based pagination with Previous / Next buttons.
- Shows `OpportunityCard` (without matched/missing section).

### 9.5 MyProfilePage (`/me`, P1)
- Shows the full profile; **Edit** toggles a form identical to registration steps 2 to 4 (no email/password) pre-filled with current data.
- **Save** sends `updateMyProfile` with the changed fields; `skills`, `interests` and `past_projects` replace the old lists. On success, `refreshProfile()` and show a green toast "Profile updated".

---

## 10. Component specs

| Component | Props | Behaviour |
|---|---|---|
| `Navbar` | none | Logged out: logo only. Logged in: logo, links **Dashboard**, **Opportunities**, **My Profile**, and a **Log out** secondary button. Collapses into a hamburger menu below 768px |
| `ProtectedRoute` / `PublicOnlyRoute` | `children` | Redirect logic from Section 4 |
| `FormField` | `label, error, children` | Label above, children (input), red error text below |
| `TagInput` | `value[], onChange, fetchSuggestions(q), placeholder, min` | Typing (debounced 250 ms) calls `fetchSuggestions` and shows a dropdown of up to 10 matches. **Enter or comma** adds the typed text (custom values allowed). Click a suggestion to add. Trim whitespace, ignore empties, de-duplicate case-insensitively, max 60 chars per tag. Tags render as neutral chips with an ✕ to remove. Backspace on empty input removes the last tag |
| `PastProjectsField` | `value[], onChange` | Repeatable block: title, description, optional link. "+ Add project" button; ✕ to remove a block |
| `SkillChip` | `label, variant: "shared"|"complementary"|"neutral"` | Styles from Section 3 |
| `MatchBadge` | `score` | Green pill, "`{score}% match`" |
| `PersonCard` | `item` (recommendation result) | Initials avatar, `full_name`, discipline badge, `MatchBadge`, one-line `reason`, chips: `shared_skills` (green) then `complementary_skills` (black) with a small label above each ("You both know", "They bring"), shared interests as neutral chips. Whole card links to `/people/{profile.id}`; has a **View profile** green button |
| `OpportunityCard` | `item` (recommendation result or plain Opportunity) | Title, `type` and `source` badges, organizer, short description (3-line clamp), `prize`, `mode`, deadline formatted `DD MMM YYYY` (hide if null), `MatchBadge` if `match_score` exists, matched skills (green) and missing skills (neutral with dashed border), **View opportunity** button opening `url` in a new tab |
| `PairOpportunityCard` | `item` | Same header as `OpportunityCard`, plus three rows: **You cover** (green chips), **They cover** (black chips), **Still needed** (dashed neutral chips; if empty show "Nothing, you two cover it all 🎉") |
| `Loader` | `fullScreen?` | Green spinner |
| `EmptyState` | `title, message, action?` | Centered icon, text, optional button |
| `ErrorBanner` | `message, onRetry?` | Styles from Section 3 |

**Helpers (`utils/skills.js`)**: `normalize(s) = s.trim().toLowerCase()`; `intersect(a, b)` and `difference(a, b)` compare using `normalize` but return the original display strings.

---

## 11. UX, responsiveness and accessibility

- Mobile first. Breakpoints: stack on mobile, 2 columns at `md`, 3 at `lg`.
- Every list has **loading** (skeleton cards), **empty** and **error** (with Retry) states.
- Buttons show a spinner and are disabled while a request is in flight (prevents double submit).
- All inputs have visible labels; keyboard focus ring is visible; chips and badges never rely on colour alone (shared/complementary also have the text labels listed above).
- Add `<title>Sparkmatch</title>` and a ⚡ favicon.
- Use `target="_blank" rel="noopener noreferrer"` on all external links.

---

## 12. Mock layer (`src/api/mock.js`)

Purpose: the full app works inside Lovable's preview without the backend. The mock implements **every function in Section 7.2 with identical return shapes** and ~300 ms artificial delay.

**Behaviour**
- **Users** are stored in `localStorage` key `sparkmatch_mock_users` (array of `{ id, email, password, profile }`). Pre-seeded demo user: `demo@sparkmatch.app` / `Demo@1234` → profile id **7** (Arjun, below).
- `register`: if the email exists, throw an error shaped like Axios: `{ response: { status: 400, data: { detail: "Validation failed.", errors: { email: ["A user with this email already exists."] } } } }`. Otherwise create the user and profile (new `id` ≥ 100, `discipline_label` looked up from the discipline list, `past_projects` get ids), store a fake token `"mock-token-<id>"`, return `{ token, user:{id,email}, profile }`.
- `login`: wrong credentials → throw `{ response: { status: 401, data: { detail: "Invalid email or password." } } }`.
- `getMe` / `getMyProfile`: look up the user from the token. `updateMyProfile`: merge the partial and persist.
- `getProfile(id)`: find in the profiles fixture or registered users; otherwise throw a 404 shaped error with `detail: "Not found."`.
- `getRecommendedProfiles`: return the **recommendation fixture** below, filtered by `discipline` if given, wrapped in the pagination envelope (respect `page` and `page_size`).
- `getRecommendedOpportunities`: return the fixture below wrapped in the envelope.
- `getPairOpportunities(id)`: use the pair table below (join `opportunity_id` with the opportunities fixture); unknown ids return an empty envelope. If `id` equals the current user's id, throw a 400 shaped error with `detail: "Cannot compare a profile with itself."`.
- `listOpportunities`: filter the opportunities fixture by `type`, `source`, `skill`, `search`; wrap in the envelope.
- `searchSkills` / `searchInterests`: case-insensitive "contains" over the lookup lists, limited to `limit`.

### 12.1 Lookups (`lookups.json`)
- **Disciplines:** `[{"value":"hardware","label":"Hardware / Electronics"},{"value":"software","label":"Software"},{"value":"design","label":"Design"},{"value":"business","label":"Business / Marketing"},{"value":"data_ai","label":"Data / AI"},{"value":"research","label":"Research"},{"value":"other","label":"Other"}]`
- **Experience levels:** `[{"value":"beginner","label":"Beginner"},{"value":"intermediate","label":"Intermediate"},{"value":"advanced","label":"Advanced"}]`
- **Skills** (id, name, category): Arduino (hardware), IoT (hardware), C++ (hardware), Raspberry Pi (hardware), PCB Design (hardware), Python (software), Django (software), REST APIs (software), React (software), JavaScript (software), SQL (software), Figma (design), UI/UX (design), Prototyping (design), Branding (design), Marketing (business), Market Research (business), Pitching (business), Finance (business), Product Management (business), Machine Learning (data_ai), Data Analysis (data_ai), Computer Vision (data_ai).
- **Interests:** Agritech, Sustainability, Healthtech, EdTech, Fintech, Open Source, Robotics, AI, Startups, Smart Cities.

### 12.2 Profiles fixture (full Profile objects)

```json
[
  { "id": 7, "email": "demo@sparkmatch.app", "full_name": "Arjun Mehta", "discipline": "hardware", "discipline_label": "Hardware / Electronics", "experience_level": "intermediate", "bio": "I build IoT gadgets for farms.", "experience_summary": "3 years of embedded systems work and two hackathon wins.", "skills": ["Arduino", "IoT", "C++"], "interests": ["Agritech", "Sustainability"], "past_projects": [{ "id": 1, "title": "Smart Irrigation", "description": "Soil-moisture based automatic pump control.", "link": "https://github.com/example/irrigation" }], "github_url": "https://github.com/example", "linkedin_url": "", "created_at": "2026-10-01T09:30:00Z" },
  { "id": 12, "email": "meera@example.com", "full_name": "Meera Iyer", "discipline": "software", "discipline_label": "Software", "experience_level": "advanced", "bio": "Backend developer who loves clean APIs.", "experience_summary": "5 years building Django services and 3 open-source contributions.", "skills": ["Python", "Django", "REST APIs", "C++", "Arduino"], "interests": ["Agritech", "Open Source"], "past_projects": [{ "id": 2, "title": "Farm Market API", "description": "REST API connecting farmers to local buyers.", "link": "" }], "github_url": "https://github.com/example-meera", "linkedin_url": "https://linkedin.com/in/example-meera", "created_at": "2026-10-02T10:00:00Z" },
  { "id": 15, "email": "kabir@example.com", "full_name": "Kabir Sharma", "discipline": "business", "discipline_label": "Business / Marketing", "experience_level": "intermediate", "bio": "Business student who has pitched at 4 startup events.", "experience_summary": "Led go-to-market for a campus IoT startup.", "skills": ["Marketing", "Market Research", "Pitching", "IoT"], "interests": ["Agritech", "Startups"], "past_projects": [{ "id": 3, "title": "Campus Smart Bins", "description": "Business plan and pilot for IoT waste bins.", "link": "" }], "github_url": "", "linkedin_url": "https://linkedin.com/in/example-kabir", "created_at": "2026-10-03T11:00:00Z" },
  { "id": 18, "email": "ananya@example.com", "full_name": "Ananya Rao", "discipline": "design", "discipline_label": "Design", "experience_level": "intermediate", "bio": "Product designer focused on accessible interfaces.", "experience_summary": "Designed 6 mobile apps and ran 2 usability studies.", "skills": ["Figma", "UI/UX", "Prototyping", "IoT"], "interests": ["Sustainability", "Healthtech"], "past_projects": [{ "id": 4, "title": "Plant Care App", "description": "Mobile UI for monitoring home plants.", "link": "https://example.com/plant-care" }], "github_url": "", "linkedin_url": "https://linkedin.com/in/example-ananya", "created_at": "2026-10-04T12:00:00Z" },
  { "id": 21, "email": "rohan@example.com", "full_name": "Rohan Das", "discipline": "data_ai", "discipline_label": "Data / AI", "experience_level": "advanced", "bio": "ML engineer who likes hardware projects.", "experience_summary": "Built crop disease detectors and two Kaggle top-10 models.", "skills": ["Python", "Machine Learning", "Data Analysis", "Arduino"], "interests": ["Agritech", "Sustainability", "AI"], "past_projects": [{ "id": 5, "title": "Crop Disease Detector", "description": "Leaf image classifier running on edge devices.", "link": "" }], "github_url": "https://github.com/example-rohan", "linkedin_url": "", "created_at": "2026-10-05T13:00:00Z" }
]
```

### 12.3 Recommended profiles fixture (for the demo user, Arjun)

Each result: `{ "profile": <ProfileSummary of the person>, "match_score", "shared_skills", "complementary_skills", "shared_interests", "reason" }`.

| Person (id) | match_score | shared_skills | complementary_skills | shared_interests | reason |
|---|---|---|---|---|---|
| Meera Iyer (12) | 64 | C++, Arduino | Python, Django, REST APIs | Agritech | "You both know C++ and Arduino. They also bring Python, Django and REST APIs." |
| Rohan Das (21) | 63 | Arduino | Python, Machine Learning, Data Analysis | Agritech, Sustainability | "You both know Arduino. They also bring Python, Machine Learning and Data Analysis." |
| Ananya Rao (18) | 58 | IoT | Figma, UI/UX, Prototyping | Sustainability | "You both know IoT. They also bring Figma, UI/UX and Prototyping." |
| Kabir Sharma (15) | 58 | IoT | Marketing, Market Research, Pitching | Agritech | "You both know IoT. They also bring Marketing, Market Research and Pitching." |

(`ProfileSummary` = the person's `id, full_name, discipline, discipline_label, experience_level, bio, skills, interests` from 12.2.)

### 12.4 Opportunities fixture (`opportunities.json`)

| id | title | type | source | organizer | required_skills | prize | mode | deadline |
|---|---|---|---|---|---|---|---|---|
| 1 | Smart India Hackathon | hackathon | unstop | Govt. of India | Python, Arduino, UI/UX | ₹1,00,000 | hybrid | 2026-12-15 |
| 2 | Hardware + AI Innovation Challenge | competition | unstop | TechFest | Arduino, Machine Learning, IoT | ₹50,000 | online | 2026-11-30 |
| 3 | GreenTech Startup Pitch Cup | competition | unstop | E-Cell | IoT, Marketing, Pitching | ₹75,000 | offline | 2026-12-05 |
| 4 | Open Source Smart Farm Platform | project | internal | Sparkmatch Community | Python, Django, IoT | | online | null |

Give each a realistic 2-sentence `description`, `url` set to a placeholder like `https://unstop.com/` (or `https://github.com/` for id 4), `image_url: ""`, and `created_at` in Oct 2026.

**Recommended opportunities for Arjun** (order as listed): id 2 → score 67, matched `[Arduino, IoT]`, missing `[Machine Learning]`; id 3 → 33, matched `[IoT]`, missing `[Marketing, Pitching]`; id 1 → 33, matched `[Arduino]`, missing `[Python, UI/UX]`; id 4 → 33, matched `[IoT]`, missing `[Python, Django]`.

### 12.5 Pair opportunities table (current user = Arjun, id 7)

| Other person | opportunity_id | match_score | you_cover | they_cover | uncovered |
|---|---|---|---|---|---|
| 12 (Meera) | 4 | 100 | IoT | Python, Django | (empty) |
| 12 (Meera) | 1 | 67 | Arduino | Python, Arduino | UI/UX |
| 21 (Rohan) | 2 | 100 | Arduino, IoT | Arduino, Machine Learning | (empty) |
| 18 (Ananya) | 1 | 67 | Arduino | UI/UX | Python |
| 15 (Kabir) | 3 | 100 | IoT | IoT, Marketing, Pitching | (empty) |

Results sorted by `match_score` descending. For users other than Arjun (newly registered), the mock returns the same fixtures so the demo always shows content.

---

## 13. Connecting to the real backend (after Lovable)

Lovable's cloud preview cannot reach a Django server running on your laptop (`127.0.0.1` from the browser sandbox, plus CORS and mixed-content limits). So:

1. Build and demo everything in Lovable with `VITE_USE_MOCKS=true`.
2. Export or sync the project to GitHub and run it locally (`npm install && npm run dev`, served at `http://localhost:5173`).
3. Create `.env` with `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` and `VITE_USE_MOCKS=false`.
4. The backend must allow CORS origins `http://localhost:5173` and `http://127.0.0.1:5173`, and the backend's Swagger docs at `/api/docs/` can be used to double check any shape.
5. Test in this order: register → login → `/auth/me/` on refresh → dashboard people → dashboard opportunities → profile detail → pair opportunities → logout.

If anything fails, compare the network response with Sections 7.3 and 12 first; mismatches are almost always a field name or a missing trailing slash.

---

## 14. Suggested build order for Lovable (one prompt per step)

1. **Setup and theme:** Tailwind config and tokens (Section 3), router with all routes (Section 4), `Navbar`, `Loader`, `EmptyState`, `ErrorBanner`, `FormField`, `SkillChip`, `MatchBadge`.
2. **API layer and mocks:** `client.js`, `errors.js`, `real.js`, `mock.js` + fixtures, `index.js` switch, `AuthContext`, `ProtectedRoute`, `PublicOnlyRoute`.
3. **AuthPage:** login form and the 4-step `RegisterStepper` with `TagInput` and `PastProjectsField`.
4. **Dashboard:** `PersonCard`, `OpportunityCard`, both sections with loading, empty and error states.
5. **ProfileDetailPage** with `PairOpportunityCard`.
6. **P1 pages:** `OpportunitiesPage`, `MyProfilePage`, discipline filter.
7. **Polish:** responsive pass, skeletons, favicon, 404 page, final check against Section 15.

---

## 15. Acceptance checklist

- [ ] Opening `/` while logged out shows the Login/Register page; the page is white with black text and green buttons.
- [ ] Demo login works in mock mode; registering a new user works and lands on the Dashboard already logged in.
- [ ] Registering with an existing email shows the error under the email field (and returns to step 1).
- [ ] Register step 3 blocks progress with fewer than 2 skills or 0 interests.
- [ ] `confirm_password` is never included in the register request.
- [ ] Dashboard shows people cards with match score, reason, green shared chips and black complementary chips, plus opportunity cards with matched and missing skills.
- [ ] Profile detail shows contact links, correctly coloured skill chips, past projects and "Opportunities for you two".
- [ ] Logging out clears `sparkmatch_token` and returns to `/login`; protected routes redirect when logged out.
- [ ] Every list has loading, empty and error states.
- [ ] No Supabase, no Bootstrap, no swipe UI anywhere.
- [ ] All API calls use trailing slashes and exact snake_case field names from Section 7.
- [ ] Setting `VITE_USE_MOCKS=false` and a real `VITE_API_BASE_URL` is the **only** change needed to use the real backend.

---

## 16. Out of scope (frontend v1)
Swiping, chat, connection requests, notifications, AI features, password reset, email verification, social login, image uploads, dark mode, i18n.
