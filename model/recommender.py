"""
AI Internship Recommendation Engine
------------------------------------
Approach: Hybrid content-based filtering.

1. TEXT SIMILARITY (TF-IDF + Cosine Similarity)
   Each student's profile (skills + interest domain) and each internship's
   profile (required skills + domain) are converted into TF-IDF vectors
   over a shared vocabulary. Cosine similarity gives a 0-1 "skill/domain
   match score".

2. RULE-BASED FILTERS / BOOSTS
   - Eligibility: CGPA must meet the internship's minimum requirement
     (hard filter, or heavy penalty).
   - Location: exact match or "Remote" gets a boost.
   - Stipend fit: internship stipend >= student's minimum expectation gets
     a small boost.
   - Experience: internships requiring longer duration slightly favor
     students with some past experience.

3. FINAL SCORE
   final_score = 0.65 * text_similarity
               + 0.15 * location_score
               + 0.10 * stipend_score
               + 0.10 * cgpa_eligibility_score

This hybrid approach is standard for recommender systems with small/medium
structured datasets where you don't yet have enough interaction history
(clicks/applications) to train a collaborative-filtering model. Once the
platform collects real usage data (applications, acceptances, ratings),
this can be extended with collaborative filtering or a learned ranking
model (e.g. gradient boosted trees on engagement labels).
"""

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class InternshipRecommender:
    def __init__(self, students_path: str, internships_path: str):
        self.students = pd.read_csv(students_path)
        self.internships = pd.read_csv(internships_path)
        self._build_index()

    def _profile_text(self, skills: str, domain: str, extra: str = "") -> str:
        skills_text = skills.replace(";", " ").replace("/", " ")
        return f"{skills_text} {domain} {domain} {extra}".lower()

    def _build_index(self):
        self.students["profile_text"] = self.students.apply(
            lambda r: self._profile_text(r["skills"], r["interest_domain"]), axis=1
        )
        self.internships["profile_text"] = self.internships.apply(
            lambda r: self._profile_text(r["required_skills"], r["domain"], r["title"]),
            axis=1,
        )

        corpus = list(self.students["profile_text"]) + list(self.internships["profile_text"])
        self.vectorizer = TfidfVectorizer()
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

        n_students = len(self.students)
        self.student_vecs = self.tfidf_matrix[:n_students]
        self.internship_vecs = self.tfidf_matrix[n_students:]

        # Full similarity matrix: rows=students, cols=internships
        self.similarity_matrix = cosine_similarity(self.student_vecs, self.internship_vecs)

    def _location_score(self, student_loc, internship_loc):
        if internship_loc == "Remote" or student_loc == "Remote":
            return 1.0
        return 1.0 if student_loc == internship_loc else 0.3

    def _stipend_score(self, student_min, internship_stipend):
        if internship_stipend >= student_min:
            return 1.0
        if student_min == 0:
            return 1.0
        # partial credit if close
        return max(0.0, internship_stipend / max(student_min, 1))

    def _cgpa_score(self, student_cgpa, min_cgpa):
        if student_cgpa >= min_cgpa:
            return 1.0
        gap = min_cgpa - student_cgpa
        return max(0.0, 1 - gap / 2.0)  # soft penalty, not hard exclusion

    def recommend_for_student(self, student_id: str, top_n: int = 5):
        if student_id not in self.students["student_id"].values:
            raise ValueError(f"Unknown student_id: {student_id}")

        idx = self.students.index[self.students["student_id"] == student_id][0]
        student = self.students.loc[idx]
        sims = self.similarity_matrix[idx]

        results = []
        for j, internship in self.internships.iterrows():
            text_sim = sims[j]
            loc_score = self._location_score(student["preferred_location"], internship["location"])
            stipend_score = self._stipend_score(student["preferred_stipend_min"], internship["stipend"])
            cgpa_score = self._cgpa_score(student["cgpa"], internship["min_cgpa"])

            final = (
                0.65 * text_sim
                + 0.15 * loc_score
                + 0.10 * stipend_score
                + 0.10 * cgpa_score
            )
            results.append({
                "internship_id": internship["internship_id"],
                "title": internship["title"],
                "company": internship["company"],
                "domain": internship["domain"],
                "location": internship["location"],
                "stipend": internship["stipend"],
                "match_score": round(float(final) * 100, 1),
                "skill_match_pct": round(float(text_sim) * 100, 1),
            })

        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results[:top_n]

    def recommend_candidates_for_internship(self, internship_id: str, top_n: int = 5):
        if internship_id not in self.internships["internship_id"].values:
            raise ValueError(f"Unknown internship_id: {internship_id}")

        j = self.internships.index[self.internships["internship_id"] == internship_id][0]
        internship = self.internships.loc[j]
        sims = self.similarity_matrix[:, j]

        results = []
        for i, student in self.students.iterrows():
            text_sim = sims[i]
            loc_score = self._location_score(student["preferred_location"], internship["location"])
            stipend_score = self._stipend_score(student["preferred_stipend_min"], internship["stipend"])
            cgpa_score = self._cgpa_score(student["cgpa"], internship["min_cgpa"])

            final = (
                0.65 * text_sim
                + 0.15 * loc_score
                + 0.10 * stipend_score
                + 0.10 * cgpa_score
            )
            results.append({
                "student_id": student["student_id"],
                "name": student["name"],
                "college": student["college"],
                "cgpa": student["cgpa"],
                "skills": student["skills"],
                "match_score": round(float(final) * 100, 1),
            })

        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results[:top_n]


if __name__ == "__main__":
    rec = InternshipRecommender("../data/students.csv", "../data/internships.csv")

    sample_student = rec.students.iloc[0]
    print(f"\nTop 5 internship recommendations for {sample_student['name']} "
          f"({sample_student['student_id']}) — skills: {sample_student['skills']}\n")
    for r in rec.recommend_for_student(sample_student["student_id"], top_n=5):
        print(f"  {r['match_score']:>5}%  {r['title']} @ {r['company']} "
              f"({r['location']}, ₹{r['stipend']})")

    sample_internship = rec.internships.iloc[0]
    print(f"\nTop 5 candidate recommendations for '{sample_internship['title']}' "
          f"@ {sample_internship['company']} — needs: {sample_internship['required_skills']}\n")
    for r in rec.recommend_candidates_for_internship(sample_internship["internship_id"], top_n=5):
        print(f"  {r['match_score']:>5}%  {r['name']} ({r['college']}, CGPA {r['cgpa']})")
