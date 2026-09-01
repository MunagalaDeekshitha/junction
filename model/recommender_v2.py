"""
Recommendation Engine v2 — adds:
  1. Skill normalization (synonym mapping) so "ML" == "Machine Learning" etc.
  2. Semantic similarity via Latent Semantic Analysis (TF-IDF + Truncated SVD)
     — a lightweight, fully local stand-in for neural embeddings. This
     captures loose semantic relationships (e.g. "Django" and "Flask" both
     loading on a "Python web backend" latent dimension) without requiring
     an internet connection to download a pretrained transformer model.
     Swap in sentence-transformers embeddings later with zero interface
     changes — just replace `_build_index()`.
  3. Explainability: every match returns a human-readable "why" breakdown,
     not just a number — critical for user trust in a recommender system.
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

# ---- Skill synonym normalization ----
SYNONYMS = {
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "js": "javascript",
    "ui/ux design": "ui ux design",
    "cloud computing (aws)": "aws cloud computing",
    "mobile app development (flutter)": "flutter mobile development",
    "nodejs": "node.js",
}


def normalize_skill(s: str) -> str:
    s = s.strip().lower()
    return SYNONYMS.get(s, s)


class InternshipRecommenderV2:
    def __init__(self, students_path=None, internships_path=None,
                 students_df=None, internships_df=None, n_components: int = 40):
        """
        Build the recommender either from CSV file paths (students_path /
        internships_path — used for quick standalone testing) or directly
        from already-loaded DataFrames (students_df / internships_df — used
        by the live backend, so it always reflects the current database,
        including profiles created after the app started).
        """
        if students_df is not None:
            self.students = students_df.reset_index(drop=True)
        else:
            self.students = pd.read_csv(students_path)

        if internships_df is not None:
            self.internships = internships_df.reset_index(drop=True)
        else:
            self.internships = pd.read_csv(internships_path)

        self.n_components = min(n_components, len(self.students) + len(self.internships) - 1)
        self._build_index()

    # ---------- text prep ----------
    def _profile_text(self, skills: str, domain: str, extra: str = "") -> str:
        skill_list = [normalize_skill(s) for s in skills.split(";")]
        return f"{' '.join(skill_list)} {domain.lower()} {domain.lower()} {extra.lower()}"

    def _skill_set(self, skills: str):
        return set(normalize_skill(s) for s in skills.split(";"))

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
        tfidf_matrix = self.vectorizer.fit_transform(corpus)

        # Latent Semantic Analysis: project TF-IDF into a dense semantic space.
        # This is our local "embedding" — related terms that co-occur across
        # many profiles end up close together even without exact word overlap.
        self.svd = TruncatedSVD(n_components=self.n_components, random_state=42)
        semantic_matrix = self.svd.fit_transform(tfidf_matrix)

        n_students = len(self.students)
        self.student_vecs = semantic_matrix[:n_students]
        self.internship_vecs = semantic_matrix[n_students:]

        self.similarity_matrix = cosine_similarity(self.student_vecs, self.internship_vecs)
        # keep raw TF-IDF too, for exact skill-overlap explanations
        self.student_skillsets = self.students["skills"].apply(self._skill_set)
        self.internship_skillsets = self.internships["required_skills"].apply(self._skill_set)

    # ---------- scoring helpers ----------
    def _location_score(self, a, b):
        if a == "Remote" or b == "Remote":
            return 1.0
        return 1.0 if a == b else 0.3

    def _stipend_score(self, student_min, offered):
        if offered >= student_min or student_min == 0:
            return 1.0
        return max(0.0, offered / max(student_min, 1))

    def _cgpa_score(self, student_cgpa, min_cgpa):
        if student_cgpa >= min_cgpa:
            return 1.0
        return max(0.0, 1 - (min_cgpa - student_cgpa) / 2.0)

    def _explain(self, student, internship, semantic_sim, shared, loc_s, stip_s, cgpa_s):
        reasons = []
        if shared:
            reasons.append(f"Shares {len(shared)} required skill(s): {', '.join(sorted(shared))}.")
        elif semantic_sim > 0.5:
            reasons.append("Skill profile is semantically similar even without exact overlap.")
        else:
            reasons.append("Limited skill overlap with this posting.")

        if student["interest_domain"] == internship["domain"]:
            reasons.append(f"Matches declared interest domain ({internship['domain']}).")

        if loc_s == 1.0:
            reasons.append(f"Location compatible ({internship['location']}).")
        else:
            reasons.append(f"Location mismatch — internship is in {internship['location']}, "
                            f"student prefers {student['preferred_location']}.")

        if stip_s == 1.0:
            reasons.append(f"Stipend (₹{internship['stipend']}) meets expectations.")
        else:
            reasons.append(f"Stipend is below the student's minimum (₹{student['preferred_stipend_min']}).")

        if cgpa_s == 1.0:
            reasons.append("Meets CGPA eligibility requirement.")
        else:
            reasons.append(f"CGPA ({student['cgpa']}) is below the internship's minimum "
                            f"({internship['min_cgpa']}).")

        return reasons

    # ---------- public API ----------
    def recommend_for_student(self, student_id: str, top_n: int = 5):
        idx = self.students.index[self.students["student_id"] == student_id][0]
        student = self.students.loc[idx]
        sims = self.similarity_matrix[idx]
        student_skills = self.student_skillsets[idx]

        results = []
        for j, internship in self.internships.iterrows():
            semantic_sim = float(sims[j])
            shared = student_skills & self.internship_skillsets[j]
            loc_s = self._location_score(student["preferred_location"], internship["location"])
            stip_s = self._stipend_score(student["preferred_stipend_min"], internship["stipend"])
            cgpa_s = self._cgpa_score(student["cgpa"], internship["min_cgpa"])

            skill_overlap_score = len(shared) / max(len(self.internship_skillsets[j]), 1)
            final = (
                0.35 * semantic_sim
                + 0.25 * skill_overlap_score
                + 0.15 * loc_s
                + 0.10 * stip_s
                + 0.15 * cgpa_s
            )

            results.append({
                "internship_id": internship["internship_id"],
                "title": internship["title"],
                "company": internship["company"],
                "match_score": round(final * 100, 1),
                "semantic_similarity": round(semantic_sim * 100, 1),
                "shared_skills": sorted(shared),
                "reasons": self._explain(student, internship, semantic_sim, shared, loc_s, stip_s, cgpa_s),
            })

        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results[:top_n]

    def recommend_candidates_for_internship(self, internship_id: str, top_n: int = 5):
        j = self.internships.index[self.internships["internship_id"] == internship_id][0]
        internship = self.internships.loc[j]
        sims = self.similarity_matrix[:, j]
        internship_skills = self.internship_skillsets[j]

        results = []
        for i, student in self.students.iterrows():
            semantic_sim = float(sims[i])
            shared = self.student_skillsets[i] & internship_skills
            loc_s = self._location_score(student["preferred_location"], internship["location"])
            stip_s = self._stipend_score(student["preferred_stipend_min"], internship["stipend"])
            cgpa_s = self._cgpa_score(student["cgpa"], internship["min_cgpa"])

            skill_overlap_score = len(shared) / max(len(internship_skills), 1)
            final = (
                0.35 * semantic_sim
                + 0.25 * skill_overlap_score
                + 0.15 * loc_s
                + 0.10 * stip_s
                + 0.15 * cgpa_s
            )

            results.append({
                "student_id": student["student_id"],
                "name": student["name"],
                "college": student["college"],
                "cgpa": student["cgpa"],
                "match_score": round(final * 100, 1),
                "shared_skills": sorted(shared),
                "reasons": self._explain(student, internship, semantic_sim, shared, loc_s, stip_s, cgpa_s),
            })

        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results[:top_n]

    def score_pair(self, student_id: str, internship_id: str):
        """Score one specific student-internship pair (used by resume-upload flow)."""
        rec = self.recommend_for_student(student_id, top_n=len(self.internships))
        return next(r for r in rec if r["internship_id"] == internship_id)


if __name__ == "__main__":
    rec = InternshipRecommenderV2("../data/students.csv", "../data/internships.csv")
    s = rec.students.iloc[3]
    print(f"Recommendations for {s['name']} ({s['student_id']}):\n")
    for r in rec.recommend_for_student(s["student_id"], top_n=3):
        print(f"  {r['match_score']}%  {r['title']} @ {r['company']}")
        for reason in r["reasons"]:
            print(f"      - {reason}")
        print()
