# Sparkmatch: Product Requirements Document (PRD)

> **Tagline:** Every great project starts with a spark. Find the people who make it catch.
> **Hackathon theme:** Bridge the Gap (connecting people across disciplines, knowledge and skills)
> **Build window:** 4 hours | **Team:** 1 frontend dev + 1 backend dev
> **Version:** 1.0 | **Status:** Ready to build

---

## 0. How to use this document

- **Section 9 (API Contract) is the source of truth** between frontend and backend. Neither side changes a URL, field name, enum value or status code without telling the other and updating this file first.
- **Section 12** has tips for building this with GitHub Copilot. Paste the contract into Copilot Chat as context.
- The frontend dev can build everything against mock data (Section 10.4) before the backend is ready.

---

## 1. Overview

### 1.1 Problem
Great projects fail not from lack of skill, but from lack of the right people. A hardware hacker with an Arduino idea needs software, design and business people, but those people live in different communities, speak different "languages" and rarely meet. This matches the hackathon's problem statement: connecting people separated by differences in knowledge, access, language or technology.

### 1.2 Solution
Sparkmatch is a web app where people register with their discipline, skills, past projects and interests. The app then:

1. **Recommends people** who share *some* of your skills (so you can communicate) but also bring *different* skills you lack (so you complement each other).
2. **Recommends projects and competitions** (hackathons, Unstop-style competitions, open projects) where the combined skills of you and a recommended person can actually be put to use.

There is **no swiping**. Users browse recommendation lists and open profiles.

### 1.3 Goals
- A new user can register, log in and see meaningful recommendations within 2 minutes.
- Recommendations visibly explain *why* a person is a good match (shared skills vs. complementary skills).
- The prototype runs end to end (frontend, API, database) with seeded demo data.

### 1.4 Non-goals (out of scope for v1)
Swiping, chat/messaging, connection requests and notifications, video calls, payments, email verification, password reset emails, social login, real-time scraping in production, admin dashboards beyond Django admin.

---

## 2. Target users and personas

| Persona | Discipline | Need |
|---|---|---|
| **Arjun** | Hardware (Arduino, IoT) | Has a smart-irrigation idea, needs backend, app UI and go-to-market people |
| **Meera** | Software (Python, Django) | Wants a hardware/IoT partner for a hackathon |
| **Kabir** | Business (marketing, finance) | Wants technical teammates for a startup competition |
| **Ananya** | Design (UI/UX) | Wants to join interdisciplinary teams and find competitions |

---

## 3. User flows

### 3.1 New user
1. Opens the site and lands on **Login/Register** page (default tab: Login, with a clear "Create account" option).
2. Chooses **Register** and completes the multi-step form (Section 5.1).
3. On success the app stores the auth token and redirects to **Dashboard**.

### 3.2 Returning user
1. Lands on Login, enters email and password, and is redirected to **Dashboard**.
2. If a valid token already exists in storage, skip login and go straight to Dashboard.

### 3.3 Discovery
1. **Dashboard** shows two sections: *People you should meet* and *Opportunities for you*.
2. Clicking a person opens **Profile Detail**, which shows their skills (shared vs. new), past projects, interests, contact links and **"Opportunities for you two"** (projects where both skill sets are needed).
3. Clicking an opportunity opens the external URL (Unstop etc.) in a new tab.

---

## 4. Features and priorities

| ID | Feature | Priority |
|---|---|---|
| F1 | Register (multi-step form, single API call) | **P0** |
| F2 | Login / logout / token auth | **P0** |
| F3 | Landing page = login/register | **P0** |
| F4 | Recommended people (overlap + complementary skills) | **P0** |
| F5 | Recommended opportunities for the user | **P0** |
| F6 | Profile detail page with "opportunities for you two" | **P0** |
| F7 | Seeded demo data (profiles, skills, opportunities) | **P0** |
| F8 | Edit my profile | P1 |
| F9 | Browse and filter all opportunities | P1 |
| F10 | Filter recommended people by discipline | P1 |
| F11 | Fetch opportunities from external sites via management command | P2 (see 6.4) |
| F12 | Connection requests | P3 (post-hackathon) |

---

## 5. Functional requirements

### 5.1 Registration form (4 steps, **one** `POST` at the end)

| Step | Fields | Validation |
|---|---|---|
| 1. Account | `email`, `password`, `confirm password` (frontend only) | Valid email, unique; password min 8 chars; passwords match |
| 2. About you | `full_name`, `discipline` (dropdown), `experience_level` (dropdown), `bio` (optional) | Name required; discipline from enum |
| 3. Skills and interests | `skills` (tag input with autocomplete, min 2), `interests` (tag input, min 1) | Min counts enforced on both sides |
| 4. Experience | `experience_summary` (textarea), `past_projects` (repeatable: title, description, optional link), optional `github_url`, `linkedin_url` | Summary required; each project needs title and description |

The frontend collects all steps in state and sends **one** request to `POST /api/v1/auth/register/`.

### 5.2 Authentication
- Token authentication (DRF `TokenAuthentication`). Header: `Authorization: Token <token>`.
- Login is by **email + password**. Backend uses the email as the Django username.
- Frontend stores the token in `localStorage` and attaches it with an axios interceptor. Any `401` response clears the token and redirects to `/login`.

### 5.3 Recommended people (core algorithm)

For the logged-in user **U** and every other profile **P**:

```
shared_skills        = skills(U) ∩ skills(P)        (case-insensitive)
complementary_skills = skills(P) − skills(U)
shared_interests     = interests(U) ∩ interests(P)
```

**Eligibility:** `len(shared_skills) >= 1` **and** `len(complementary_skills) >= 2`.
(Constants live in one settings file: `MIN_SHARED_SKILLS = 1`, `MIN_COMPLEMENTARY_SKILLS = 2`.)

**Score (0 to 100, integer):**

```
overlap_ratio     = len(shared_skills) / len(skills(U))
complement_ratio  = len(complementary_skills) / len(skills(P))
discipline_bonus  = 1 if discipline(U) != discipline(P) else 0
interest_ratio    = len(shared_interests) / max(1, len(interests(U) ∪ interests(P)))

match_score = round(100 * (0.35*overlap_ratio + 0.35*complement_ratio
                           + 0.15*discipline_bonus + 0.15*interest_ratio))
```

- Sort by `match_score` descending. Exclude the user themselves.
- **Fallback:** if fewer than 5 eligible results, fill the rest with profiles of a *different discipline* with at least 1 shared interest, flagged by lower scores. This avoids an empty dashboard in the demo.
- Each result includes a human-readable `reason`, e.g. *"You both know Python. They also bring Arduino and IoT."*

### 5.4 Recommended opportunities

**For the user alone** (`/recommendations/opportunities/`):
```
matched_skills = required_skills(O) ∩ skills(U)
missing_skills = required_skills(O) − skills(U)
match_score    = round(100 * len(matched_skills) / len(required_skills(O)))
```
Include opportunities with at least 1 matched skill, active, and deadline null or in the future. Sort by score, then by nearest deadline.

**For a pair** (`/recommendations/pair/{profile_id}/opportunities/`): the "bridge" feature.
```
you_cover  = required(O) ∩ skills(U)
they_cover = required(O) ∩ skills(P)
combined   = you_cover ∪ they_cover
uncovered  = required(O) − combined
```
**Eligible only if** `you_cover` is non-empty **and** `they_cover` is non-empty **and** at least one skill is covered by exactly one of the two (so both people are genuinely needed).
`match_score = round(100 * len(combined) / len(required(O)))`.

### 5.5 Opportunities data
- Stored in the `Opportunity` table (Section 8).
- **Source of data in the 4-hour build: a seed JSON file** loaded with `python manage.py seed_demo`.
- Real fetching from external sites is optional (see 6.4).

---

## 6. Technical architecture

### 6.1 Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + JavaScript, Tailwind CSS, HTML/CSS; `react-router-dom`, `axios` |
| Backend | Django 5 + Django REST Framework |
| Auth | DRF Token Authentication |
| Database | SQLite (`db.sqlite3`) |
| API docs | `drf-spectacular` (auto OpenAPI + Swagger UI at `/api/docs/`) |
| CORS | `django-cors-headers` |

> **Tailwind vs. Bootstrap:** the two frameworks fight over base styles and class names (`container`, `row`, `btn`, `collapse`). **Use Tailwind as the only styling system.** If Bootstrap is required, use `react-bootstrap` components (e.g. Modal, Toast) only, and never import Bootstrap's global CSS.

### 6.2 Repository layout (monorepo)

```
sparkmatch/
├── prd.md
├── backend/
│   ├── manage.py
│   ├── config/                 # settings.py, urls.py
│   ├── accounts/               # register, login, logout, me
│   ├── profiles/               # Profile, Skill, Interest, PastProject
│   ├── opportunities/          # Opportunity, seed + fetch commands
│   ├── recommendations/        # scoring logic + endpoints
│   ├── common/                 # exception handler, pagination
│   └── seed/                   # skills.json, profiles.json, opportunities.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/                # axios client + one file per resource
        ├── components/
        ├── pages/              # Auth, Dashboard, ProfileDetail, Opportunities, MyProfile
        ├── context/AuthContext.jsx
        ├── mocks/              # JSON copies of Section 9 responses
        └── main.jsx
```

### 6.3 Environments and CORS

| Item | Value |
|---|---|
| Backend dev URL | `http://127.0.0.1:8000` |
| Frontend dev URL | `http://localhost:5173` (Vite default) |
| API base path | `/api/v1/` |
| Frontend env var | `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` |
| CORS allowed origins | `http://localhost:5173`, `http://127.0.0.1:5173` |
| Trailing slashes | **Always required** (Django default). Frontend must always include them |

### 6.4 Fetching external opportunities (be realistic)
Unstop and similar sites generally have **no official public API**, and scraping can violate their terms of service and breaks easily. Plan:
1. **Hackathon build:** seed 12 to 15 realistic opportunities into `seed/opportunities.json` (real names and links of well-known competitions, with `source` set accordingly).
2. **Stretch (P2):** a management command `fetch_opportunities` with a pluggable fetcher per source. Prefer official APIs, RSS feeds or manual CSV import where available, and check each site's terms first. The rest of the app must never depend on this command succeeding.

---

## 7. Design system

| Token | Value | Usage |
|---|---|---|
| `spark-green` | `#70e000` | Primary buttons, highlights, badges, active nav, progress bar |
| `ink` | `#000000` | All text, headings, icons, borders, complementary-skill chips |
| `paper` | `#ffffff` | Page and card backgrounds |

**Rules**
- **Never use green text on a white background.** `#70e000` on white fails contrast. Use green as a *background* with black text, or green text on black.
- Primary button: green background, black text, black bold label; hover darkens slightly (e.g. `#5cc100`).
- Navbar: white background, black text, 1px black bottom border, green logo badge (⚡ Sparkmatch). Full frontend styling details are in `frontend-prd.md` Section 3.
- Cards: white, 1px black or light-grey border, rounded-xl, subtle shadow.
- **Skill chips:** shared skills = green background; complementary skills = black background, white text (makes the "different skills" idea visible at a glance).
- Match score: circular or pill badge, green with black text.
- Font: a clean sans-serif (Inter or Poppins via Google Fonts, with system fallback).

**Tailwind config snippet**
```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { spark: "#70e000", "spark-dark": "#5cc100", ink: "#000000", paper: "#ffffff" },
    },
  },
  plugins: [],
};
```

---

## 8. Data model (Django)

```python
# profiles/models.py
class Skill(models.Model):
    name = models.CharField(max_length=60)               # display name e.g. "Arduino"
    slug = models.SlugField(max_length=60, unique=True)  # lowercase key used for matching
    category = models.CharField(max_length=20, blank=True)  # a discipline value, optional

class Interest(models.Model):
    name = models.CharField(max_length=60)
    slug = models.SlugField(max_length=60, unique=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=120)
    discipline = models.CharField(max_length=20, choices=DISCIPLINES)
    experience_level = models.CharField(max_length=20, choices=LEVELS)
    bio = models.TextField(blank=True)
    experience_summary = models.TextField()
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    skills = models.ManyToManyField(Skill, related_name="profiles")
    interests = models.ManyToManyField(Interest, related_name="profiles")
    created_at = models.DateTimeField(auto_now_add=True)

class PastProject(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="past_projects")
    title = models.CharField(max_length=150)
    description = models.TextField()
    link = models.URLField(blank=True)

# opportunities/models.py
class Opportunity(models.Model):
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPES)      # competition|hackathon|project|other
    source = models.CharField(max_length=40)                   # "unstop", "devpost", "internal", ...
    organizer = models.CharField(max_length=150, blank=True)
    url = models.URLField()
    description = models.TextField()
    prize = models.CharField(max_length=100, blank=True)
    mode = models.CharField(max_length=10, default="online")   # online|offline|hybrid
    deadline = models.DateField(null=True, blank=True)
    image_url = models.URLField(blank=True)
    required_skills = models.ManyToManyField(Skill, related_name="opportunities")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Skill and interest handling on write:** the API accepts plain strings. For each string the backend trims whitespace, creates `slug = slugify(name)`, then `get_or_create` by slug (keeping the first-seen display name). Matching always uses `slug`.

### Enums (identical on both sides)

| Enum | Allowed values (`value` → label) |
|---|---|
| `discipline` | `hardware` → Hardware / Electronics, `software` → Software, `design` → Design, `business` → Business / Marketing, `data_ai` → Data / AI, `research` → Research, `other` → Other |
| `experience_level` | `beginner` → Beginner, `intermediate` → Intermediate, `advanced` → Advanced |
| `opportunity.type` | `competition`, `hackathon`, `project`, `other` |
| `opportunity.mode` | `online`, `offline`, `hybrid` |

---

## 9. API contract (single source of truth)

### 9.1 Global conventions

| Topic | Rule |
|---|---|
| Base URL | `/api/v1/` (all paths below are relative to it, **with trailing slash**) |
| Format | JSON in, JSON out. `Content-Type: application/json` |
| Key naming | **snake_case** everywhere (request and response) |
| Auth header | `Authorization: Token <token>` on every endpoint except register, login and meta/skills lookups marked "Public" |
| IDs | Integers |
| Dates | `deadline` is `YYYY-MM-DD`; `created_at` is ISO 8601 UTC |
| Skills/interests in a **profile** | Array of **strings** (display names) |
| Lists | Paginated envelope (below), except where marked "plain list" |
| Empty optional strings | `""` (never `null`). Optional date `deadline` may be `null` |

**Pagination envelope** (default page size 10, `?page=2`, `?page_size=` max 50)
```json
{ "count": 24, "next": "http://127.0.0.1:8000/api/v1/opportunities/?page=2", "previous": null, "results": [] }
```

**Error format (all errors, always this shape)**
```json
{ "detail": "Human readable summary.", "errors": { "email": ["A user with this email already exists."] } }
```
- `errors` is present for validation errors (400) and omitted otherwise.
- Backend implements this in one custom DRF `EXCEPTION_HANDLER` in `common/exceptions.py`.

**Status codes**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created (register) |
| 204 | No content (logout) |
| 400 | Validation error |
| 401 | Missing or invalid token, or wrong credentials on login |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

### 9.2 Shared object shapes

**Profile (full)**
```json
{
  "id": 7,
  "email": "arjun@example.com",
  "full_name": "Arjun Mehta",
  "discipline": "hardware",
  "discipline_label": "Hardware / Electronics",
  "experience_level": "intermediate",
  "bio": "I build IoT gadgets for farms.",
  "experience_summary": "3 years of embedded systems work and two hackathon wins.",
  "skills": ["Arduino", "IoT", "C++"],
  "interests": ["Agritech", "Sustainability"],
  "past_projects": [
    { "id": 1, "title": "Smart Irrigation", "description": "Soil-moisture based pump control.", "link": "https://github.com/arjun/irrigation" }
  ],
  "github_url": "https://github.com/arjun",
  "linkedin_url": "",
  "created_at": "2026-10-17T09:30:00Z"
}
```

**ProfileSummary** (used inside recommendation lists)
```json
{
  "id": 12,
  "full_name": "Meera Iyer",
  "discipline": "software",
  "discipline_label": "Software",
  "experience_level": "advanced",
  "bio": "Backend dev who loves APIs.",
  "skills": ["Python", "Django", "REST APIs"],
  "interests": ["Agritech", "Open Source"]
}
```

**Opportunity**
```json
{
  "id": 3,
  "title": "Smart India Hackathon",
  "type": "hackathon",
  "source": "unstop",
  "organizer": "Govt. of India",
  "url": "https://unstop.com/hackathons/example",
  "description": "National level hardware and software hackathon.",
  "prize": "₹1,00,000",
  "mode": "hybrid",
  "deadline": "2026-12-15",
  "image_url": "",
  "required_skills": ["Python", "Arduino", "UI/UX"],
  "created_at": "2026-10-01T10:00:00Z"
}
```

### 9.3 Auth endpoints

#### `POST /auth/register/` (Public)
Creates the user and profile in one call and returns a token (the user is logged in immediately).

Request
```json
{
  "email": "arjun@example.com",
  "password": "StrongPass123",
  "full_name": "Arjun Mehta",
  "discipline": "hardware",
  "experience_level": "intermediate",
  "bio": "I build IoT gadgets for farms.",
  "experience_summary": "3 years of embedded systems work.",
  "skills": ["Arduino", "IoT", "C++"],
  "interests": ["Agritech", "Sustainability"],
  "past_projects": [
    { "title": "Smart Irrigation", "description": "Soil-moisture based pump control.", "link": "" }
  ],
  "github_url": "",
  "linkedin_url": ""
}
```
Required: `email`, `password`, `full_name`, `discipline`, `experience_level`, `experience_summary`, `skills` (min 2), `interests` (min 1). Optional: `bio`, `past_projects`, `github_url`, `linkedin_url`.

Response `201`
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": { "id": 7, "email": "arjun@example.com" },
  "profile": { "...Profile (full)..." }
}
```
Errors: `400` with `errors` per field (e.g. duplicate email, weak password, fewer than 2 skills).

#### `POST /auth/login/` (Public)
Request
```json
{ "email": "arjun@example.com", "password": "StrongPass123" }
```
Response `200`: same shape as register's `201` body.
Errors: `400` if fields missing; `401` with `{"detail": "Invalid email or password."}` on bad credentials.

#### `POST /auth/logout/` (Auth)
Deletes the user's token. Response `204`, empty body.

#### `GET /auth/me/` (Auth)
Response `200`
```json
{ "user": { "id": 7, "email": "arjun@example.com" }, "profile": { "...Profile (full)..." } }
```
The frontend calls this on app load to validate a stored token.

### 9.4 Profile endpoints

| Method and path | Auth | Description | Response |
|---|---|---|---|
| `GET /profiles/me/` | Yes | Current user's profile | `200` Profile (full) |
| `PATCH /profiles/me/` | Yes | Partial update. Accepts any registration profile field. `skills`, `interests` and `past_projects`, if sent, **replace** the existing lists. `email` and `password` cannot be changed here | `200` Profile (full) |
| `GET /profiles/{id}/` | Yes | Any user's profile | `200` Profile (full), `404` if missing |

### 9.5 Lookup endpoints (for forms and autocomplete)

| Method and path | Auth | Response |
|---|---|---|
| `GET /meta/disciplines/` | Public | **Plain list:** `[{"value":"hardware","label":"Hardware / Electronics"}, ...]` |
| `GET /meta/experience-levels/` | Public | **Plain list:** `[{"value":"beginner","label":"Beginner"}, ...]` |
| `GET /skills/?search=ard&limit=10` | Public | **Plain list:** `[{"id":1,"name":"Arduino","category":"hardware"}]` (case-insensitive contains, max `limit`, default 10) |
| `GET /interests/?search=agri&limit=10` | Public | **Plain list:** `[{"id":4,"name":"Agritech"}]` |

### 9.6 Recommendation endpoints

#### `GET /recommendations/profiles/` (Auth)
Query params: `discipline` (optional enum filter), `page`, `page_size` (default 10).

Response `200` (paginated envelope)
```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "profile": { "...ProfileSummary..." },
      "match_score": 82,
      "shared_skills": ["Python"],
      "complementary_skills": ["Arduino", "IoT"],
      "shared_interests": ["Agritech"],
      "reason": "You both know Python. They also bring Arduino and IoT."
    }
  ]
}
```
Notes: `shared_skills` and `complementary_skills` use display names. Sorted by `match_score` descending. The current user never appears.

#### `GET /recommendations/opportunities/` (Auth)
Query params: `type` (optional), `page`, `page_size`.

Response `200` (paginated envelope)
```json
{
  "count": 4, "next": null, "previous": null,
  "results": [
    {
      "opportunity": { "...Opportunity..." },
      "match_score": 67,
      "matched_skills": ["Python", "Django"],
      "missing_skills": ["UI/UX"]
    }
  ]
}
```

#### `GET /recommendations/pair/{profile_id}/opportunities/` (Auth)
Opportunities where **both** the current user and the given profile are needed (Section 5.4). Query params: `page`, `page_size`.

Response `200` (paginated envelope)
```json
{
  "count": 2, "next": null, "previous": null,
  "results": [
    {
      "opportunity": { "...Opportunity..." },
      "match_score": 100,
      "you_cover": ["Python"],
      "they_cover": ["Arduino", "IoT"],
      "uncovered": []
    }
  ]
}
```
Errors: `404` if `profile_id` doesn't exist; `400` with `{"detail": "Cannot compare a profile with itself."}` if it equals the current user's profile id.

### 9.7 Opportunity endpoints

| Method and path | Auth | Description | Response |
|---|---|---|---|
| `GET /opportunities/` | Yes | Browse all active opportunities. Params: `type`, `source`, `skill` (name), `search` (title/description), `page`, `page_size` | `200` paginated list of Opportunity |
| `GET /opportunities/{id}/` | Yes | Single opportunity | `200` Opportunity, `404` if missing |

### 9.8 Endpoint summary table

| # | Method | Path | Auth | Priority |
|---|---|---|---|---|
| 1 | POST | `/auth/register/` | No | P0 |
| 2 | POST | `/auth/login/` | No | P0 |
| 3 | POST | `/auth/logout/` | Yes | P0 |
| 4 | GET | `/auth/me/` | Yes | P0 |
| 5 | GET | `/profiles/me/` | Yes | P1 |
| 6 | PATCH | `/profiles/me/` | Yes | P1 |
| 7 | GET | `/profiles/{id}/` | Yes | P0 |
| 8 | GET | `/meta/disciplines/` | No | P0 |
| 9 | GET | `/meta/experience-levels/` | No | P0 |
| 10 | GET | `/skills/` | No | P0 |
| 11 | GET | `/interests/` | No | P0 |
| 12 | GET | `/recommendations/profiles/` | Yes | P0 |
| 13 | GET | `/recommendations/opportunities/` | Yes | P0 |
| 14 | GET | `/recommendations/pair/{profile_id}/opportunities/` | Yes | P0 |
| 15 | GET | `/opportunities/` | Yes | P1 |
| 16 | GET | `/opportunities/{id}/` | Yes | P1 |

---

## 10. Frontend requirements

### 10.1 Routes

| Route | Page | Access |
|---|---|---|
| `/` | Redirects to `/dashboard` if logged in, else `/login` | Public |
| `/login` | Login / Register page (tabs or toggle). **This is the landing page** | Public only (redirect to dashboard if logged in) |
| `/register` | Multi-step registration (also reachable via the tab) | Public only |
| `/dashboard` | Recommended people + recommended opportunities | Protected |
| `/people/:id` | Profile detail + "Opportunities for you two" | Protected |
| `/opportunities` | Browse and filter all opportunities (P1) | Protected |
| `/me` | View and edit own profile (P1) | Protected |

### 10.2 Key components
`Navbar`, `AuthTabs`, `RegisterStepper`, `TagInput` (with autocomplete to `/skills/` and `/interests/`), `PastProjectsField` (repeatable), `PersonCard`, `SkillChip` (variants: `shared`, `complementary`, `neutral`), `MatchBadge`, `OpportunityCard`, `ProtectedRoute`, `Loader`, `EmptyState`, `ErrorBanner`.

### 10.3 Frontend behaviour rules
- One axios instance in `src/api/client.js` with `baseURL = import.meta.env.VITE_API_BASE_URL`, a request interceptor that adds the token, and a response interceptor that handles `401`.
- Show backend `errors` field messages under the matching form field; show `detail` in an `ErrorBanner`.
- Every list view needs loading, empty and error states.
- Responsive (mobile first). Cards stack on mobile, 2 to 3 columns on desktop.
- Skill chips: green for shared, black for complementary (Section 7).

### 10.4 Working before the backend exists
Put the JSON examples from Section 9 into `src/mocks/` and add a tiny switch in the API layer:
```js
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
```
Alternatively use **MSW (Mock Service Worker)** to intercept the exact URLs above. When the backend is ready, set `VITE_USE_MOCKS=false`. If the shapes match Section 9, nothing else changes.

---

## 11. Backend requirements

- Use `ModelSerializer`/`Serializer` classes whose field names match Section 9 **exactly**. Do not rely on DRF's default naming.
- Custom `EXCEPTION_HANDLER` producing the `detail`/`errors` shape.
- `DEFAULT_PAGINATION_CLASS` = `PageNumberPagination`, `page_size = 10`, `page_size_query_param = "page_size"`, `max_page_size = 50`.
- `DEFAULT_AUTHENTICATION_CLASSES` = `TokenAuthentication`; `DEFAULT_PERMISSION_CLASSES` = `IsAuthenticated` (override with `AllowAny` on public views).
- Wrap registration in `transaction.atomic()` so a failure never leaves a user without a profile.
- Put scoring in `recommendations/services.py` as pure functions (`score_profile_match`, `score_opportunity_match`, `score_pair_opportunity`) with unit tests for the three examples below.
- Enable `drf-spectacular` and expose `/api/schema/` and `/api/docs/` so the frontend dev can see live endpoints.
- Management command `python manage.py seed_demo` loads: ~40 skills, ~15 interests, **15 demo profiles** spread across all disciplines (password for all: `Demo@1234`), and **12 to 15 opportunities**.
- Register models in Django admin.

**Scoring test cases**

| Case | Input | Expected |
|---|---|---|
| Eligible person | U skills `[Python, Django]`; P skills `[Python, Arduino, IoT]` | shared `[Python]`, complementary `[Arduino, IoT]` → eligible |
| Too similar | U `[Python, Django]`; P `[Python, Django]` | complementary empty → **not eligible** |
| Pair opportunity | O requires `[Python, Arduino, UI/UX]`; U `[Python]`; P `[Arduino]` | you_cover `[Python]`, they_cover `[Arduino]`, uncovered `[UI/UX]`, score 67 |

---

## 12. Building with GitHub Copilot

**Setup tips**
1. Commit this `prd.md` to the repo root and keep it open in a tab. Copilot Chat uses open files as context.
2. Create `.github/copilot-instructions.md` with: *"Follow prd.md Section 9 exactly. Use snake_case JSON keys, trailing slashes on all URLs, DRF Token auth, Tailwind only, colors spark #70e000 / ink #000 / paper #fff."*
3. Work **one small task per prompt**, and always reference the section number.

**Example prompts**

*Backend*
- "Using prd.md Section 8, create the Django models for Skill, Interest, Profile, PastProject and Opportunity."
- "Create the register endpoint exactly as in prd.md Section 9.3, with nested past_projects, skills and interests handled via get_or_create on slug."
- "Write a custom DRF exception handler that returns `{detail, errors}` as in prd.md Section 9.1."
- "Implement `score_profile_match` per prd.md Section 5.3 and write pytest tests from Section 11."

*Frontend*
- "Create an axios client with a token interceptor and a 401 redirect to /login. Base URL from VITE_API_BASE_URL."
- "Build a 4-step RegisterStepper in React with Tailwind following prd.md Section 5.1. Colors: spark #70e000, ink #000."
- "Build PersonCard showing match_score badge, shared_skills as green chips and complementary_skills as black chips, using the JSON in prd.md Section 9.6."

**Review habit:** after every generated endpoint or API call, compare the field names with Section 9 before committing. Copilot likes to invent camelCase names.

---

## 13. Collaboration protocol (avoiding frontend/backend conflicts)

1. **Freeze the contract** (Section 9) at minute 0 after both of you read it once together.
2. **Git:** `main` (stable), `backend-dev`, `frontend-dev`. Merge small and often. Never edit the other person's folder.
3. **Contract changes:** message the other dev, edit Section 9 in the same commit, and add a line to the changelog below.
4. **Integration checkpoints:** (a) after Hour 1: auth works end to end; (b) after Hour 2:30: recommendations render real data.
5. Backend shares the Swagger URL (`/api/docs/`) as soon as it runs. Frontend tests with it before wiring UI.
6. Run both servers locally. If testing on different laptops, use the backend dev's LAN IP and add it to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.

**Contract changelog**

| Date/time | Change | By |
|---|---|---|
| v1.0 | Initial contract | Both |

---

## 14. 4-hour build plan

| Time | Backend dev | Frontend dev |
|---|---|---|
| 0:00 – 0:20 | Both read PRD, freeze contract, set up repo. Backend: Django project, DRF, CORS, spectacular | Vite + React + Tailwind setup, theme colors, router, axios client |
| 0:20 – 1:00 | Models, migrations, seed command, `meta`/`skills`/`interests` endpoints | Login/Register page shell, `TagInput`, `ProtectedRoute`, AuthContext (using mocks) |
| 1:00 – 1:45 | Register, login, logout, me, profile endpoints | RegisterStepper fully built, login form, error display |
| **1:45** | **Checkpoint A: auth integration.** Switch frontend to the real API | |
| 1:45 – 2:45 | Scoring services + 3 recommendation endpoints + opportunities list | Dashboard, PersonCard, OpportunityCard, ProfileDetail page |
| **2:45** | **Checkpoint B: recommendations integration** | |
| 2:45 – 3:30 | Fix bugs, unit tests for scoring, optional `PATCH /profiles/me/` | Polish UI, empty/loading/error states, responsive pass, `/opportunities` page |
| 3:30 – 4:00 | Final seed check, `README`, run instructions | Deploy or record demo, test full flow once, prepare 2-minute demo script |

**If you fall behind, cut in this order:** `/me` edit page → `/opportunities` browse/filter → discipline filter → pair opportunities fallback logic. **Never cut:** register, login, recommended people, recommended opportunities.

---

## 15. Acceptance criteria

- [ ] Visiting `/` while logged out shows the Login/Register page.
- [ ] A new user can complete registration and arrives on the Dashboard already logged in.
- [ ] Registering with a duplicate email shows an inline error under the email field.
- [ ] Dashboard shows recommended people, each with a match score, at least 1 shared skill and at least 2 complementary skills.
- [ ] Shared and complementary skills are visually distinct (green vs. black chips).
- [ ] Dashboard shows recommended opportunities with matched and missing skills.
- [ ] Profile Detail shows "Opportunities for you two" with who covers what.
- [ ] Logging out clears the token and returns to Login; protected routes redirect when logged out.
- [ ] All API responses match Section 9 field names and types exactly.
- [ ] The UI uses only white, `#70e000` and black (plus neutral greys).

---

## 16. Demo script (2 minutes)

1. "Arjun builds Arduino-based irrigation systems but has no software or business skills." Register Arjun (hardware, Arduino, IoT, C++; interest: Agritech).
2. Dashboard: "Sparkmatch finds people who share a little with him and bring a lot he lacks." Show Meera (shares C++, brings Python, Django) with green and black chips.
3. Open Meera's profile: "And here are competitions where *both* of them are needed", pointing at the pair opportunities and who covers what.
4. Close: *"Great projects don't fail from lack of skill, but from lack of the right people. Sparkmatch bridges the gap."*

---

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| API mismatch between frontend and backend | Section 9 contract, Swagger docs, mock-first frontend, checkpoints |
| Sparse data makes recommendations empty | Seed 15 diverse profiles and 12+ opportunities; fallback rule in 5.3 |
| External opportunity sources have no public API | Seed data first; fetching is a stretch goal (6.4) |
| Tailwind and Bootstrap style clashes | Tailwind only (Section 6.1) |
| CORS or trailing-slash errors | Config in 6.3; frontend always uses trailing slashes |
| Running out of time | Priority list (Section 4) and cut order (Section 14) |

---

## 18. Future scope
Connection requests and in-app chat, AI "Gap Finder" (describe an idea, get the roles needed), AI pitch translator across disciplines, team formation (3 to 5 people), reputation badges, email verification and password reset, real-time opportunity ingestion via partnerships.
