"""
Resume Parser
-------------
Extracts raw text from an uploaded resume (PDF or DOCX) and matches it
against a known skill taxonomy to auto-populate a student's skill list —
so students don't have to manually re-type everything already on their resume.

Approach:
  1. Extract text (pdfplumber for PDFs, python-docx for .docx).
  2. Normalize and scan for occurrences of known skills (+ synonyms) using
     word-boundary matching so "R" doesn't match inside "React", etc.
  3. Return matched skills + basic heuristics (years of experience mentions,
     education keywords) that a UI can show for the student to confirm/edit
     before saving — a human should always be able to correct auto-extraction.
"""

import re
import pdfplumber
from docx import Document

SKILLS_TAXONOMY = [
    "Python", "JavaScript", "React", "Node.js", "SQL", "Machine Learning",
    "Data Analysis", "Java", "C++", "HTML", "CSS", "Django", "Flask",
    "TensorFlow", "PyTorch", "Excel", "Communication", "Public Speaking",
    "Figma", "UI/UX Design", "AWS", "Docker", "Git", "Statistics", "R",
    "Tableau", "Marketing", "SEO", "Content Writing", "Graphic Design",
    "Video Editing", "Project Management", "Sales", "Customer Service",
    "Accounting", "Financial Modeling", "Cybersecurity", "Networking",
    "Linux", "Flutter", "Kotlin", "Swift", "Power BI", "MongoDB",
    "Kubernetes", "GraphQL", "REST APIs", "Agile", "Scrum",
]

# aliases -> canonical skill name in taxonomy
ALIASES = {
    "ml": "Machine Learning",
    "ai": "Machine Learning",
    "js": "JavaScript",
    "nodejs": "Node.js",
    "node": "Node.js",
    "aws": "AWS",
    "amazon web services": "AWS",
    "ui/ux": "UI/UX Design",
    "ux design": "UI/UX Design",
    "power bi": "Power BI",
    "rest api": "REST APIs",
    "restful apis": "REST APIs",
}


def extract_text_from_pdf(path: str) -> str:
    text_chunks = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_chunks.append(page_text)
    return "\n".join(text_chunks)


def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(path: str) -> str:
    if path.lower().endswith(".pdf"):
        return extract_text_from_pdf(path)
    elif path.lower().endswith(".docx"):
        return extract_text_from_docx(path)
    else:
        raise ValueError("Unsupported file type — please upload a .pdf or .docx resume")


def find_skills(text: str):
    text_lower = text.lower()
    found = set()

    # direct taxonomy matches (word-boundary aware)
    for skill in SKILLS_TAXONOMY:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)

    # alias matches
    for alias, canonical in ALIASES.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, text_lower):
            found.add(canonical)

    return sorted(found)


def estimate_experience_months(text: str) -> int:
    """Very rough heuristic: look for 'X years' / 'X months' mentions."""
    months = 0
    for match in re.finditer(r"(\d+)\s*\+?\s*year", text.lower()):
        months = max(months, int(match.group(1)) * 12)
    for match in re.finditer(r"(\d+)\s*\+?\s*month", text.lower()):
        months = max(months, int(match.group(1)))
    return months


def parse_resume(path: str) -> dict:
    text = extract_text(path)
    skills = find_skills(text)
    experience_months = estimate_experience_months(text)
    return {
        "extracted_skills": skills,
        "estimated_experience_months": experience_months,
        "raw_text_preview": text[:400],
        "note": "Auto-extracted — please review and edit before saving your profile.",
    }


if __name__ == "__main__":
    # Quick self-test using a generated sample .docx resume
    doc = Document()
    doc.add_heading("Ananya Sharma", level=1)
    doc.add_paragraph("B.Tech CSE, VIT Vellore | 3+ years of coursework in Machine Learning")
    doc.add_paragraph("Skills: Python, SQL, Machine Learning, Statistics, Data Analysis, Git")
    doc.add_paragraph("Worked as a teaching assistant for 6 months, tutoring students in R and Excel.")
    doc.save("/tmp/sample_resume.docx")

    result = parse_resume("/tmp/sample_resume.docx")
    print("Extracted skills:", result["extracted_skills"])
    print("Estimated experience (months):", result["estimated_experience_months"])
