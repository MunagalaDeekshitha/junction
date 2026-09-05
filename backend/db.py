"""
Database layer — plain sqlite3 (no ORM) since SQLAlchemy isn't available
in this environment. Swap-compatible with the PostgreSQL schema described
in architecture_plan.md; the table shapes match 1:1.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "junction.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college TEXT,
    degree TEXT,
    year INTEGER,
    cgpa REAL,
    skills TEXT,              -- semicolon separated
    interest_domain TEXT,
    preferred_location TEXT,
    preferred_stipend_min INTEGER,
    past_experience_months INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS internships (
    internship_id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    domain TEXT,
    required_skills TEXT,     -- semicolon separated
    location TEXT,
    stipend INTEGER,
    duration_months INTEGER,
    min_cgpa REAL,
    openings INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS applications (
    application_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    status TEXT DEFAULT 'applied',   -- applied / shortlisted / rejected / hired
    match_score REAL,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (internship_id) REFERENCES internships(internship_id)
);

CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    event_type TEXT NOT NULL,   -- view / apply / shortlist / hire
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,              -- 'student' or 'company'
    student_id TEXT,                 -- set when role = 'student'
    company_name TEXT,               -- set when role = 'company'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
"""


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def seed_from_csv(students_csv: str, internships_csv: str):
    import csv
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM students")
    if cur.fetchone()[0] == 0:
        with open(students_csv) as f:
            for row in csv.DictReader(f):
                cur.execute(
                    """INSERT OR IGNORE INTO students
                       (student_id, name, college, degree, year, cgpa, skills,
                        interest_domain, preferred_location, preferred_stipend_min,
                        past_experience_months)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                    (row["student_id"], row["name"], row["college"], row["degree"],
                     row["year"], row["cgpa"], row["skills"], row["interest_domain"],
                     row["preferred_location"], row["preferred_stipend_min"],
                     row["past_experience_months"]),
                )

    cur.execute("SELECT COUNT(*) FROM internships")
    if cur.fetchone()[0] == 0:
        with open(internships_csv) as f:
            for row in csv.DictReader(f):
                cur.execute(
                    """INSERT OR IGNORE INTO internships
                       (internship_id, company, title, domain, required_skills,
                        location, stipend, duration_months, min_cgpa, openings)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (row["internship_id"], row["company"], row["title"], row["domain"],
                     row["required_skills"], row["location"], row["stipend"],
                     row["duration_months"], row["min_cgpa"], row["openings"]),
                )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()
    seed_from_csv("../data/students.csv", "../data/internships.csv")
    conn = get_connection()
    n_students = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    n_internships = conn.execute("SELECT COUNT(*) FROM internships").fetchone()[0]
    print(f"DB initialized at {DB_PATH}: {n_students} students, {n_internships} internships")
    conn.close()
