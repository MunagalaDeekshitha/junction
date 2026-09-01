# Junction — Setup Guide

Yes — download everything. Here's exactly where each file goes and what to do with it.

## 1. Recreate this folder structure on your machine

```
junction/
├── data/
│   ├── generate_data.py
│   ├── students.csv
│   └── internships.csv
├── model/
│   ├── recommender.py        (v1 — TF-IDF baseline, run standalone to sanity-check)
│   └── recommender_v2.py     (v2 — semantic similarity + explainability, used by the backend)
├── backend/
│   ├── app.py                 (Flask API)
│   ├── db.py                  (SQLite setup + seeding)
│   ├── resume_parser.py       (resume upload → auto-extracted skills)
│   └── requirements.txt
├── webapp/
│   └── junction_app.jsx       (React prototype UI — this is the same thing rendered
│                                as an artifact above; download it if you want the
│                                raw file to drop into your own React project)
└── architecture_plan.md
```

`app.py` imports the recommender with `sys.path.append(... "model")`, so as long as
`model/recommender_v2.py` sits next to `data/` and `backend/` in the same parent
folder (as shown above), the import resolves automatically. There's no need to keep
the duplicate copy inside `backend/` — that was just so I could hand it to you in one
zip-like batch; delete it once your folders are set up correctly.

## 2. Install dependencies
```bash
cd junction/backend
pip install -r requirements.txt
```

## 3. Run the backend API
```bash
python3 app.py
```
Starts a Flask server at **http://localhost:5001**. On first run it creates
`junction.db` (SQLite) and seeds it from `data/students.csv` / `data/internships.csv`.

Try it:
```bash
curl http://localhost:5001/api/health
curl http://localhost:5001/api/recommendations/student/S0001
```

Key endpoints:
| Method | Path | What it does |
|---|---|---|
| GET | `/api/students` | list all students |
| GET | `/api/recommendations/student/<id>` | ranked internships + reasons |
| GET | `/api/recommendations/internship/<id>` | ranked candidates + reasons |
| POST | `/api/applications` | apply (body: `{student_id, internship_id}`) |
| POST | `/api/resume/parse` | upload a resume (`multipart/form-data`, field name `resume`) → extracted skills |

## 4. The web app (`junction_app.jsx`)
This is a self-contained React component — it currently uses a small built-in sample
dataset and does the matching math client-side (mirrors the Python logic) so it works
without a running backend. To wire it to your real Flask API instead, swap the
in-file `STUDENTS`/`INTERNSHIPS`/`scoreMatch()` for `fetch()` calls, e.g.:
```js
const res = await fetch(`http://localhost:5001/api/recommendations/student/${studentId}`);
const data = await res.json();
```
Drop the file into any React project (Create React App, Vite, Next.js) — it has no
special dependencies beyond React itself.

## 5. Regenerate or expand the dataset
```bash
cd junction/data
python3 generate_data.py
```
Edit the skill/company/domain lists at the top of the script to fit your real use
case, then re-run to regenerate `students.csv` / `internships.csv`.

## 6. Read `architecture_plan.md`
This covers the full target system (auth, PostgreSQL, deployment, and the roadmap
for moving from content-based filtering to a learned ranking model once you have
real usage data) — useful once you're ready to move past this prototype.
