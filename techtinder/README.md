# Sparkmatch backend

This project implements a Django backend for the Sparkmatch product described in the PRD: people are matched on overlapping skills and interests, and opportunities are recommended based on fit. The app is structured around the profile, catalog, opportunity, recommendation, and auth flows the product needs.

## Project structure

```text
techtinder/
??? accounts/                  # auth and session bootstrap
?   ??? serializers.py
?   ??? urls.py
?   ??? views.py
??? catalog/                   # shared skill, interest, and metadata data
?   ??? data/
?   ?   ??? catalog.json
?   ??? management/commands/
?   ?   ??? seed_catalog.py
?   ??? models.py
?   ??? urls.py
?   ??? views.py
??? common/                    # shared helpers
?   ??? exceptions.py
?   ??? vectors.py
??? config/                    # Django project settings and API routing
?   ??? settings.py
?   ??? urls.py
?   ??? wsgi.py
??? opportunities/             # opportunity catalogue and filtering
?   ??? data/projects.json
?   ??? management/commands/
?   ?   ??? seed_projects.py
?   ??? models.py
?   ??? urls.py
?   ??? views.py
?   ??? tests.py
??? profiles/                  # user profiles and profile updates
?   ??? admin.py
?   ??? models.py
?   ??? serializers.py
?   ??? testing.py
?   ??? urls.py
?   ??? views.py
??? recommendations/           # recommendation engine
?   ??? services.py
?   ??? urls.py
?   ??? views.py
??? templates/
?   ??? demo.html
??? manage.py
??? requirements.txt
??? db.sqlite3
??? README.md
```

## Local setup

```bash
python -m venv .venv
. .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate --run-syncdb
python manage.py seed_catalog
python manage.py seed_projects
python manage.py seed_demo
python manage.py runserver
```

### Demo seed commands

```bash
python manage.py seed_catalog      # populates skills, interests, and experience options
python manage.py seed_projects     # loads sample opportunities/projects
python manage.py seed_demo          # creates demo accounts with demo12345
```

Demo users created by `seed_demo` are meant for local development and frontend smoke tests. Use `demo12345` as the common password.

## API overview

The canonical API prefix is `/api/v1/` and the app also keeps compatibility aliases for the older public routes.

### Authentication

- `POST /api/v1/auth/register/` ? register with email/password, returns token and profile payload
- `POST /api/v1/auth/login/` ? log in and receive a token
- `POST /api/v1/auth/logout/` ? invalidate the current token
- `GET /api/v1/auth/me/` ? fetch current user + profile

### Catalog / meta

- `GET /api/v1/meta/` ? disciplines + experience levels + lookup data
- `GET /api/v1/skills/` ? searchable skill list
- `GET /api/v1/interests/` ? searchable interest list

### Profiles

- `GET /api/v1/profiles/me/` ? current authenticated profile
- `PATCH /api/v1/profiles/me/` ? update profile fields
- `GET /api/v1/profiles/<id>/` ? fetch another profile

### Opportunities

- `GET /api/v1/opportunities/` ? list active opportunities with fit data
- `GET /api/v1/opportunities/<id>/` ? fetch an opportunity by id

### Recommendations

- `GET /api/v1/recommendations/profiles/` ? rank profiles for the authenticated user
- `GET /api/v1/recommendations/opportunities/` ? rank opportunities for the authenticated user
- `GET /api/v1/recommendations/pair/<profile_id>/` ? compare a user with another profile and show pair-aligned opportunities

## Response conventions

- Use token authentication for protected routes.
- JSON is snake_case and keyed by the PRD field names.
- Public lookup endpoints return simple arrays or `{value, label}` metadata objects.
- Recommendation endpoints return paginated results where applicable and include scored match payloads.

## Recommendation logic

The scoring layer intentionally separates the matching rules from the API surface:

- `score_profile_match()` measures profile overlap, complementary skills, and shared interests
- `score_opportunity_match()` ranks opportunities based on the user?s skill overlap
- `score_pair_opportunity()` evaluates whether a pair can jointly cover an opportunity

This keeps the matching heuristics readable and testable outside the view layer.

## Validation

Run the app checks after code changes:

```bash
python manage.py check
python manage.py migrate --run-syncdb
python manage.py seed_catalog
python manage.py seed_demo
```

The project is designed to be a clean Sparkmatch backend implementation and is intentionally structured around the PRD flow rather than the earlier Tech Tinder prototype.
