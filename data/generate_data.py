"""
Generates synthetic data for the AI Internship Recommendation System.
Produces two files:
  - students.csv   (student profiles)
  - internships.csv (company internship postings)
"""

import json
import random
import csv

random.seed(42)

SKILLS_POOL = [
    "Python", "JavaScript", "React", "Node.js", "SQL", "Machine Learning",
    "Data Analysis", "Java", "C++", "HTML/CSS", "Django", "Flask",
    "TensorFlow", "PyTorch", "Excel", "Communication", "Public Speaking",
    "Figma", "UI/UX Design", "Cloud Computing (AWS)", "Docker", "Git",
    "Statistics", "R", "Tableau", "Marketing", "SEO", "Content Writing",
    "Graphic Design", "Video Editing", "Project Management", "Sales",
    "Customer Service", "Accounting", "Financial Modeling", "Cybersecurity",
    "Networking", "Linux", "Mobile App Development (Flutter)", "Kotlin",
    "Swift"
]

DOMAINS = [
    "Software Development", "Data Science", "Web Development",
    "UI/UX Design", "Digital Marketing", "Finance", "Human Resources",
    "Mechanical Engineering", "Electrical Engineering", "Business Analytics",
    "Product Management", "Content & Media", "Cybersecurity", "Sales",
    "Operations"
]

CITIES = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi NCR",
          "Remote", "Guntur", "Vijayawada", "Kolkata"]

COLLEGES = ["IIT Delhi", "NIT Warangal", "VIT Vellore", "BITS Pilani",
            "Anna University", "Delhi University", "SRM University",
            "Amrita University", "Osmania University", "JNTU Kakinada"]

DEGREES = ["B.Tech CSE", "B.Tech ECE", "B.Tech Mechanical", "BBA", "B.Com",
           "MBA", "M.Tech Data Science", "B.Sc Statistics", "BCA", "MCA"]

FIRST_NAMES = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha",
               "Karthik", "Divya", "Arjun", "Meera", "Rahul", "Neha",
               "Suresh", "Kavya", "Aditya", "Pooja", "Manoj", "Isha",
               "Sandeep", "Lakshmi"]
LAST_NAMES = ["Sharma", "Reddy", "Iyer", "Verma", "Nair", "Gupta", "Rao",
              "Menon", "Patel", "Das", "Kumar", "Singh", "Naidu", "Pillai"]

COMPANY_NAMES = ["NovaTech Solutions", "BrightWave Analytics", "PixelForge Studios",
                  "Quantum Finlabs", "GreenLeaf Logistics", "Skyline Media Group",
                  "CoreStack Systems", "Vertex Consulting", "BlueOrbit AI",
                  "Aster Retail Corp", "Nimbus Cloud Services", "Redwood HealthTech",
                  "Falcon Cybersecurity", "Lumen EdTech", "Orion Manufacturing"]

INTERNSHIP_TITLES = {
    "Software Development": ["Software Engineering Intern", "Backend Developer Intern", "Full Stack Intern"],
    "Data Science": ["Data Science Intern", "ML Engineering Intern", "Data Analyst Intern"],
    "Web Development": ["Frontend Developer Intern", "Web Development Intern"],
    "UI/UX Design": ["UI/UX Design Intern", "Product Design Intern"],
    "Digital Marketing": ["Digital Marketing Intern", "SEO Intern", "Social Media Intern"],
    "Finance": ["Finance Intern", "Financial Analyst Intern"],
    "Human Resources": ["HR Intern", "Talent Acquisition Intern"],
    "Mechanical Engineering": ["Mechanical Design Intern", "R&D Intern"],
    "Electrical Engineering": ["Electrical Engineering Intern", "Embedded Systems Intern"],
    "Business Analytics": ["Business Analyst Intern", "Operations Analyst Intern"],
    "Product Management": ["Product Management Intern", "APM Intern"],
    "Content & Media": ["Content Writing Intern", "Video Editing Intern"],
    "Cybersecurity": ["Cybersecurity Intern", "SOC Analyst Intern"],
    "Sales": ["Sales Intern", "Business Development Intern"],
    "Operations": ["Operations Intern", "Supply Chain Intern"],
}

def sample_skills(k_min=3, k_max=7):
    k = random.randint(k_min, k_max)
    return random.sample(SKILLS_POOL, k)

def gen_students(n=150):
    students = []
    for i in range(1, n + 1):
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        domain_interest = random.choice(DOMAINS)
        skills = sample_skills()
        students.append({
            "student_id": f"S{i:04d}",
            "name": name,
            "college": random.choice(COLLEGES),
            "degree": random.choice(DEGREES),
            "year": random.choice([2, 3, 4]),
            "cgpa": round(random.uniform(6.0, 9.8), 2),
            "skills": ";".join(skills),
            "interest_domain": domain_interest,
            "preferred_location": random.choice(CITIES),
            "preferred_stipend_min": random.choice([0, 5000, 10000, 15000, 20000]),
            "past_experience_months": random.choice([0, 0, 0, 2, 3, 6, 12]),
        })
    return students

def gen_internships(n=60):
    internships = []
    for i in range(1, n + 1):
        domain = random.choice(DOMAINS)
        title = random.choice(INTERNSHIP_TITLES[domain])
        req_skills = sample_skills(3, 6)
        internships.append({
            "internship_id": f"I{i:04d}",
            "company": random.choice(COMPANY_NAMES),
            "title": title,
            "domain": domain,
            "required_skills": ";".join(req_skills),
            "location": random.choice(CITIES),
            "stipend": random.choice([0, 5000, 8000, 10000, 15000, 20000, 30000]),
            "duration_months": random.choice([2, 3, 6]),
            "min_cgpa": round(random.uniform(6.0, 8.5), 2),
            "openings": random.randint(1, 5),
        })
    return internships

def write_csv(rows, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":
    students = gen_students(150)
    internships = gen_internships(60)
    write_csv(students, "students.csv")
    write_csv(internships, "internships.csv")
    with open("students.json", "w") as f:
        json.dump(students, f, indent=2)
    with open("internships.json", "w") as f:
        json.dump(internships, f, indent=2)
    print(f"Generated {len(students)} students and {len(internships)} internships.")
