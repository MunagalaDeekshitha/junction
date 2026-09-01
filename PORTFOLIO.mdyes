# Junction — Portfolio Summary

## One-line description (for a resume bullet)
> Built Junction, a full-stack AI-powered internship matching platform with an
> explainable recommendation engine, REST API, resume parser, and React frontend —
> designed and implemented independently end-to-end.

## Elevator pitch (for an interview, ~30 seconds)
"Junction is a two-sided platform that matches students to internships and companies
to candidates. I built the whole stack myself: a synthetic dataset of students and
internships, a recommendation engine using TF-IDF and Latent Semantic Analysis to
score matches on skills, domain, location, stipend, and eligibility, a Flask REST
API with SQLite for persistence, a resume parser that auto-extracts skills from
uploaded PDFs/DOCX files, and a React frontend where students and companies can
create profiles and get ranked, explainable matches in real time."

## What to say if asked "is it a real AI model?"
Be honest and precise — this is actually a strength, not a weakness, if explained well:
> "It's a content-based recommender using TF-IDF and Latent Semantic Analysis — the
> same family of technique used by early recommendation systems before deep learning
> became standard. It's explainable by design: every match comes with plain-English
> reasons, not just a black-box score. I designed it this way deliberately for a
> cold-start problem — with no historical interaction data yet (no past
> applications/hires to learn from), content-based filtering is the right first step.
> The architecture doc I wrote lays out how I'd evolve it to collaborative filtering
> or a learned ranking model once real usage data exists."

This shows you understand *why* you made the technical choice, not just that you made it —
that's what separates a strong answer from a shaky one.

## Skills this project demonstrates
- **Machine Learning / NLP:** TF-IDF vectorization, cosine similarity, Latent Semantic
  Analysis (dimensionality reduction via Truncated SVD), feature engineering,
  weighted multi-factor scoring, explainable AI design
- **Backend development:** REST API design, Flask, SQLite schema design, CRUD
  endpoints, CORS handling
- **Data engineering:** synthetic dataset generation, data modeling
- **Frontend development:** React (hooks, state management, controlled forms),
  API integration, UI/UX design with a custom design system
- **File processing:** PDF/DOCX text extraction and entity recognition (resume parsing)
- **System design:** wrote a full architecture plan covering auth, database schema,
  deployment, and a phased ML roadmap
- **DevOps:** deployment to cloud platforms (Render, Vercel), environment configuration

## Suggested resume bullets (pick 2-3 that fit your target role)
- Designed and built an explainable AI recommendation engine using TF-IDF and LSA,
  matching candidates to opportunities across 5 weighted factors (skills, domain,
  location, compensation, eligibility)
- Built a Flask REST API with 12+ endpoints handling profile management, matching,
  and application workflows, backed by a normalized SQLite schema
- Implemented a resume parser using pdfplumber/python-docx that auto-extracts skills
  from unstructured PDF/DOCX text with synonym normalization
- Developed a responsive React frontend with real-time API integration, custom
  data visualizations (match-confidence gauges), and dual user-role workflows
- Authored a full system architecture document covering data modeling, ML pipeline
  evolution, and deployment strategy

## What's genuinely good about this project (for your own confidence)
- It's end-to-end: data → ML → API → UI → deployment. Many student projects stop at
  a Jupyter notebook; you shipped a working product.
- The explainability design (showing *why* a match was made) is a real, current
  best practice in recommender systems — not a shortcut.
- You made deliberate, defensible technical trade-offs (content-based filtering for
  a cold-start problem) rather than just picking the fanciest-sounding technique.

## Honest limitations to mention if asked (shows maturity, not weakness)
- Currently uses synthetic data, not real student/company data
- No authentication/login system yet (anyone can create any profile)
- Free-tier hosting sleeps after inactivity — fine for a demo, not for production scale
- The ML approach would benefit from real interaction data (applications, hires) to
  move to a learned ranking model — this is explicitly the "Phase 2" in the
  architecture plan, showing forward thinking
