"""
Junction API — Flask backend

Endpoints:
  GET    /api/students                        list all students
  GET    /api/students/<id>                    get one student
  POST   /api/students                         create/update a student profile
  GET    /api/internships                      list all internships
  GET    /api/internships/<id>                  get one internship
  POST   /api/internships                      create an internship posting
  GET    /api/recommendations/student/<id>      top internships for a student (with reasons)
  GET    /api/recommendations/internship/<id>   top candidates for an internship (with reasons)
  POST   /api/applications                      student applies to an internship
  GET    /api/applications/student/<id>         a student's applications
  GET    /api/applications/internship/<id>      applicants for an internship
  PATCH  /api/applications/<id>                 update application status (shortlist/reject/hire)
  POST   /api/resume/parse                      upload a resume (pdf/docx), get extracted skills

Run with:  python3 app.py   (serves on http://localhost:5001)
"""

import os
import sys
import tempfile

from flask import Flask, request, jsonify

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "model"))

import db
from resume_parser import parse_resume
from recommender_v2 import InternshipRecommenderV2

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    # Allows the React app / test page (running from a different origin,
    # e.g. a plain file:// page or a dev server on another port) to call
    # this API from the browser. Without this, browsers block the request
    # with a CORS error even though the server itself works fine.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
    return response


@app.route("/api/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    # Browsers send a preflight OPTIONS request before certain cross-origin
    # POST/PATCH calls (e.g. JSON bodies). Respond with an empty 204 so the
    # real request is allowed through.
    return "", 204


db.init_db()
db.seed_from_csv(
    os.path.join(os.path.dirname(__file__), "..", "data", "students.csv"),
    os.path.join(os.path.dirname(__file__), "..", "data", "internships.csv"),
)

# The recommender loads its own CSV snapshot at startup. In production this
# would be rebuilt periodically (e.g. nightly job) or on every write via an
# incremental index — fine for a prototype to rebuild lazily on demand.
_recommender_cache = {"instance": None}


def get_recommender():
    # Rebuilds the recommender from the LIVE database every time it's
    # invalidated (i.e. after any new student/internship is saved), so
    # newly created profiles are always included in matching — not just
    # the original CSV snapshot.
    if _recommender_cache["instance"] is None:
        import pandas as pd
        conn = db.get_connection()
        students_df = pd.read_sql_query("SELECT * FROM students", conn)
        internships_df = pd.read_sql_query("SELECT * FROM internships", conn)
        conn.close()
        _recommender_cache["instance"] = InternshipRecommenderV2(
            students_df=students_df, internships_df=internships_df
        )
    return _recommender_cache["instance"]


def row_to_dict(row):
    return {k: row[k] for k in row.keys()}


# ---------------- Students ----------------
@app.get("/api/students")
def list_students():
    conn = db.get_connection()
    rows = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/students/<student_id>")
def get_student(student_id):
    conn = db.get_connection()
    row = conn.execute("SELECT * FROM students WHERE student_id = ?", (student_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "student not found"}), 404
    return jsonify(row_to_dict(row))


@app.post("/api/students")
def create_student():
    data = request.get_json()
    required = ["student_id", "name", "skills", "interest_domain"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"missing fields: {missing}"}), 400

    conn = db.get_connection()
    conn.execute(
        """INSERT INTO students
           (student_id, name, college, degree, year, cgpa, skills, interest_domain,
            preferred_location, preferred_stipend_min, past_experience_months)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(student_id) DO UPDATE SET
             name=excluded.name, college=excluded.college, degree=excluded.degree,
             year=excluded.year, cgpa=excluded.cgpa, skills=excluded.skills,
             interest_domain=excluded.interest_domain,
             preferred_location=excluded.preferred_location,
             preferred_stipend_min=excluded.preferred_stipend_min,
             past_experience_months=excluded.past_experience_months""",
        (
            data["student_id"], data["name"], data.get("college", ""),
            data.get("degree", ""), data.get("year", 1), data.get("cgpa", 0.0),
            ";".join(data["skills"]) if isinstance(data["skills"], list) else data["skills"],
            data["interest_domain"], data.get("preferred_location", "Remote"),
            data.get("preferred_stipend_min", 0), data.get("past_experience_months", 0),
        ),
    )
    conn.commit()
    conn.close()
    _recommender_cache["instance"] = None  # invalidate cache so new profile is picked up
    return jsonify({"status": "saved", "student_id": data["student_id"]}), 201


# ---------------- Internships ----------------
@app.get("/api/internships")
def list_internships():
    conn = db.get_connection()
    rows = conn.execute("SELECT * FROM internships").fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/internships/<internship_id>")
def get_internship(internship_id):
    conn = db.get_connection()
    row = conn.execute("SELECT * FROM internships WHERE internship_id = ?", (internship_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "internship not found"}), 404
    return jsonify(row_to_dict(row))


@app.post("/api/internships")
def create_internship():
    data = request.get_json()
    required = ["internship_id", "company", "title", "domain", "required_skills"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"missing fields: {missing}"}), 400

    conn = db.get_connection()
    conn.execute(
        """INSERT INTO internships
           (internship_id, company, title, domain, required_skills, location,
            stipend, duration_months, min_cgpa, openings)
           VALUES (?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(internship_id) DO UPDATE SET
             company=excluded.company, title=excluded.title, domain=excluded.domain,
             required_skills=excluded.required_skills, location=excluded.location,
             stipend=excluded.stipend, duration_months=excluded.duration_months,
             min_cgpa=excluded.min_cgpa, openings=excluded.openings""",
        (
            data["internship_id"], data["company"], data["title"], data["domain"],
            ";".join(data["required_skills"]) if isinstance(data["required_skills"], list) else data["required_skills"],
            data.get("location", "Remote"), data.get("stipend", 0),
            data.get("duration_months", 3), data.get("min_cgpa", 0.0),
            data.get("openings", 1),
        ),
    )
    conn.commit()
    conn.close()
    _recommender_cache["instance"] = None
    return jsonify({"status": "saved", "internship_id": data["internship_id"]}), 201


# ---------------- Recommendations ----------------
@app.get("/api/recommendations/student/<student_id>")
def recommend_for_student(student_id):
    top_n = int(request.args.get("top_n", 5))
    rec = get_recommender()
    try:
        results = rec.recommend_for_student(student_id, top_n=top_n)
    except IndexError:
        return jsonify({"error": "student not found"}), 404
    return jsonify(results)


@app.get("/api/recommendations/internship/<internship_id>")
def recommend_for_internship(internship_id):
    top_n = int(request.args.get("top_n", 5))
    rec = get_recommender()
    try:
        results = rec.recommend_candidates_for_internship(internship_id, top_n=top_n)
    except IndexError:
        return jsonify({"error": "internship not found"}), 404
    return jsonify(results)


# ---------------- Applications ----------------
@app.post("/api/applications")
def apply():
    data = request.get_json()
    student_id, internship_id = data.get("student_id"), data.get("internship_id")
    if not student_id or not internship_id:
        return jsonify({"error": "student_id and internship_id are required"}), 400

    conn = db.get_connection()
    student_exists = conn.execute(
        "SELECT 1 FROM students WHERE student_id = ?", (student_id,)
    ).fetchone()
    internship_exists = conn.execute(
        "SELECT 1 FROM internships WHERE internship_id = ?", (internship_id,)
    ).fetchone()
    conn.close()
    if not student_exists:
        return jsonify({"error": f"student_id '{student_id}' does not exist"}), 404
    if not internship_exists:
        return jsonify({"error": f"internship_id '{internship_id}' does not exist"}), 404

    rec = get_recommender()
    try:
        match = rec.score_pair(student_id, internship_id)
        match_score = match["match_score"]
    except (StopIteration, IndexError, KeyError):
        match_score = None

    conn = db.get_connection()
    cur = conn.execute(
        "INSERT INTO applications (student_id, internship_id, match_score) VALUES (?,?,?)",
        (student_id, internship_id, match_score),
    )
    conn.execute(
        "INSERT INTO interactions (student_id, internship_id, event_type) VALUES (?,?,?)",
        (student_id, internship_id, "apply"),
    )
    conn.commit()
    application_id = cur.lastrowid
    conn.close()
    return jsonify({"status": "applied", "application_id": application_id, "match_score": match_score}), 201


@app.get("/api/applications/student/<student_id>")
def student_applications(student_id):
    conn = db.get_connection()
    rows = conn.execute(
        """SELECT a.*, i.title, i.company FROM applications a
           JOIN internships i ON a.internship_id = i.internship_id
           WHERE a.student_id = ? ORDER BY a.applied_at DESC""",
        (student_id,),
    ).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/applications/internship/<internship_id>")
def internship_applicants(internship_id):
    conn = db.get_connection()
    rows = conn.execute(
        """SELECT a.*, s.name, s.college, s.cgpa FROM applications a
           JOIN students s ON a.student_id = s.student_id
           WHERE a.internship_id = ? ORDER BY a.match_score DESC""",
        (internship_id,),
    ).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.patch("/api/applications/<int:application_id>")
def update_application(application_id):
    data = request.get_json()
    status = data.get("status")
    if status not in ("applied", "shortlisted", "rejected", "hired"):
        return jsonify({"error": "invalid status"}), 400

    conn = db.get_connection()
    conn.execute("UPDATE applications SET status = ? WHERE application_id = ?", (status, application_id))
    row = conn.execute(
        "SELECT student_id, internship_id FROM applications WHERE application_id = ?",
        (application_id,),
    ).fetchone()
    if row and status in ("shortlisted", "hired"):
        conn.execute(
            "INSERT INTO interactions (student_id, internship_id, event_type) VALUES (?,?,?)",
            (row["student_id"], row["internship_id"], status),
        )
    conn.commit()
    conn.close()
    return jsonify({"status": "updated"})


# ---------------- Resume parsing ----------------
@app.post("/api/resume/parse")
def parse_resume_endpoint():
    if "resume" not in request.files:
        return jsonify({"error": "no file uploaded — use form field name 'resume'"}), 400

    file = request.files["resume"]
    if not file.filename.lower().endswith((".pdf", ".docx")):
        return jsonify({"error": "only .pdf and .docx files are supported"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = parse_resume(tmp_path)
    finally:
        os.remove(tmp_path)

    return jsonify(result)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "junction-api"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
