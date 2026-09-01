# AI Internship Recommendation System — Architecture Plan

## 1. Vision
A two-sided platform where:
- **Students** create a profile (skills, degree, CGPA, interests, location, stipend needs) and receive ranked internship recommendations.
- **Companies** post internships and receive ranked candidate recommendations, instead of manually screening every application.

## 2. High-Level Architecture

```
┌───────────────────┐        ┌───────────────────┐
│   Student Web App │        │   Company Web App  │
│ (React/Next.js)   │        │ (React/Next.js)    │
└─────────┬─────────┘        └─────────┬──────────┘
          │        HTTPS / REST or GraphQL         │
          ▼                                        ▼
┌─────────────────────────────────────────────────────┐
│                API Gateway / Backend                 │
│         (Node.js/Express or Python/FastAPI)          │
│  - Auth (JWT, OAuth for college email/company email)  │
│  - Profile CRUD (students, companies, internships)    │
│  - Application workflow (apply, shortlist, status)     │
│  - Notification service (email/SMS)                    │
└───────────────┬───────────────────────┬───────────────┘
                │                       │
                ▼                       ▼
     ┌────────────────────┐   ┌────────────────────────┐
     │   Primary Database  │   │  Recommendation Service │
     │ (PostgreSQL)        │   │ (Python microservice)   │
     │ - users             │   │ - TF-IDF / embeddings    │
     │ - students          │   │ - similarity scoring     │
     │ - internships       │   │ - ranking + filters      │
     │ - applications      │   │ - retrainable pipeline   │
     └────────┬────────────┘   └───────────┬─────────────┘
              │                            │
              └──────────► Feature Store ◄─┘
                     (skills taxonomy, embeddings cache,
                      interaction logs: views/applies/hires)
```

## 3. Core Components

### 3.1 Frontend (2 portals, shared design system)
- **Student portal:** profile builder, recommended internships feed, application tracker, resume upload.
- **Company portal:** post internship, view ranked candidate list, shortlist/reject, analytics dashboard.
- Tech: React + Tailwind (or Next.js for SSR/SEO on public internship listings).

### 3.2 Backend API
- Auth & role management (student vs company vs admin).
- CRUD for profiles, internships, applications.
- Orchestrates calls to the Recommendation Service and caches results.
- Tech: FastAPI (Python) — convenient since it shares language with the ML service — or Node/Express if the team prefers JS end-to-end.

### 3.3 Recommendation Engine (the "AI" core)
**Phase 1 (cold start, no interaction data) — what we built in this session:**
- Content-based filtering: TF-IDF vectors over skills + domain text, cosine similarity between student and internship profiles.
- Weighted rule layer: location match, stipend fit, CGPA eligibility.
- Fully explainable — every score can be broken down into "why this was recommended."

**Phase 2 (once real usage data exists):**
- Log implicit signals: views, applications, shortlists, hires, ratings.
- Move to hybrid recommender: combine content-based score with collaborative filtering (matrix factorization) or a learned ranker (e.g., LightGBM/XGBoost) trained on "did this pairing lead to a shortlist/hire."
- Use sentence embeddings (e.g., a small transformer) instead of TF-IDF for richer semantic matching (e.g., "ML" ≈ "Machine Learning" ≈ "AI/ML").

### 3.4 Data Layer
- **PostgreSQL** for transactional data (users, profiles, applications).
- **Feature store / cache** (Redis) for precomputed embeddings and hot recommendation results.
- **Object storage** (S3-compatible) for resumes/portfolios.

### 3.5 Supporting Services
- Notification service (email on new match / application status change).
- Admin dashboard (moderate postings, view platform metrics).
- Analytics pipeline (match quality, conversion funnel: recommended → applied → shortlisted → hired).

## 4. Data Model (simplified)

| Entity | Key Fields |
|---|---|
| `students` | student_id, name, college, degree, year, cgpa, skills[], interest_domain, location, stipend_min |
| `internships` | internship_id, company_id, title, domain, required_skills[], location, stipend, min_cgpa, duration, openings |
| `companies` | company_id, name, industry, verified |
| `applications` | application_id, student_id, internship_id, status (applied/shortlisted/rejected/hired), applied_at |
| `interactions` | student_id, internship_id, event_type (view/apply/shortlist/hire), timestamp — **used to retrain the model over time** |

## 5. Matching Algorithm (current implementation)

```
final_score = 0.65 × text_similarity(skills+domain)
            + 0.15 × location_match
            + 0.10 × stipend_fit
            + 0.10 × cgpa_eligibility
```

This is intentionally interpretable so both students and companies can see *why* a match was suggested — important for trust in an early-stage system.

## 6. Build Roadmap

| Stage | Deliverable | Status |
|---|---|---|
| 1 | Synthetic dataset (150 students, 60 internships) | ✅ Done this session |
| 2 | Content-based recommendation engine (Python) | ✅ Done this session |
| 3 | Interactive web prototype (student + company views) | ✅ Done this session |
| 4 | Real backend API + database (FastAPI + PostgreSQL) | Next step |
| 5 | Authentication + real user onboarding | Next step |
| 6 | Interaction logging + Phase 2 ML (collaborative/learned ranking) | Future |
| 7 | Resume parsing (auto-extract skills from uploaded PDF resumes) | Future |
| 8 | Deployment (Docker + cloud hosting) | Future |

## 7. Suggested Tech Stack Summary
- **Frontend:** React (or Next.js), Tailwind CSS
- **Backend:** FastAPI (Python) or Node/Express
- **Database:** PostgreSQL
- **Cache/Feature store:** Redis
- **ML:** scikit-learn (Phase 1) → sentence-transformers + LightGBM (Phase 2)
- **Hosting:** Docker containers on any cloud (AWS/GCP/Azure) or Railway/Render for a quick MVP deploy
- **File storage:** S3-compatible bucket for resumes
