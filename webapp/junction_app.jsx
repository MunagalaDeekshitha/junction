import React, { useState, useMemo } from "react";

/* ---------------- Design tokens ----------------
Background canvas: #ECEFEA (soft sage-white, not cream)
Card surface:       #FFFFFF
Text primary:       #1C2321
Text muted:         #5B6660
Accent forest:      #1F6F54  (primary action / high match)
Accent gold:        #D99A2B  (mid match / highlight)
Accent coral:       #C1503B  (low match / alerts, used sparingly)
Border:             #D8DED6
Display face: Fraunces (serif, characterful)
Body face:    IBM Plex Sans
Data face:    IBM Plex Mono
--------------------------------------------------*/

const FONT_IMPORT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

// ---------------- Sample dataset (mirrors the generated CSV structure) ----------------
const STUDENTS = [
  { id: "S001", name: "Ananya Sharma", college: "VIT Vellore", degree: "B.Tech CSE", year: 3, cgpa: 8.4, skills: ["Python", "Machine Learning", "SQL", "Statistics", "Data Analysis"], domain: "Data Science", location: "Bangalore", stipendMin: 10000 },
  { id: "S002", name: "Rohan Verma", college: "NIT Warangal", degree: "B.Tech ECE", year: 4, cgpa: 7.6, skills: ["React", "JavaScript", "Node.js", "HTML/CSS", "Git"], domain: "Web Development", location: "Remote", stipendMin: 8000 },
  { id: "S003", name: "Priya Iyer", college: "BITS Pilani", degree: "BBA", year: 2, cgpa: 8.9, skills: ["Marketing", "SEO", "Content Writing", "Communication", "Figma"], domain: "Digital Marketing", location: "Mumbai", stipendMin: 5000 },
  { id: "S004", name: "Karthik Reddy", college: "IIT Delhi", degree: "B.Tech CSE", year: 3, cgpa: 9.1, skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Statistics"], domain: "Data Science", location: "Hyderabad", stipendMin: 15000 },
  { id: "S005", name: "Meera Nair", college: "Anna University", degree: "B.Sc Statistics", year: 3, cgpa: 7.8, skills: ["Excel", "SQL", "Tableau", "Data Analysis", "Communication"], domain: "Business Analytics", location: "Chennai", stipendMin: 8000 },
  { id: "S006", name: "Aditya Menon", college: "SRM University", degree: "BCA", year: 2, cgpa: 6.9, skills: ["Java", "C++", "Git", "Linux", "Networking"], domain: "Software Development", location: "Pune", stipendMin: 5000 },
  { id: "S007", name: "Divya Patel", college: "Delhi University", degree: "MBA", year: 1, cgpa: 8.2, skills: ["Financial Modeling", "Excel", "Accounting", "Communication", "Project Management"], domain: "Finance", location: "Delhi NCR", stipendMin: 12000 },
  { id: "S008", name: "Arjun Das", college: "Osmania University", degree: "B.Tech Mechanical", year: 4, cgpa: 7.3, skills: ["Cybersecurity", "Linux", "Networking", "Python", "Git"], domain: "Cybersecurity", location: "Remote", stipendMin: 10000 },
  { id: "S009", name: "Sneha Kumar", college: "Amrita University", degree: "BCA", year: 3, cgpa: 8.6, skills: ["UI/UX Design", "Figma", "Graphic Design", "HTML/CSS", "Communication"], domain: "UI/UX Design", location: "Bangalore", stipendMin: 6000 },
  { id: "S010", name: "Vikram Singh", college: "JNTU Kakinada", degree: "B.Tech CSE", year: 3, cgpa: 7.0, skills: ["Python", "Django", "SQL", "React", "Docker"], domain: "Software Development", location: "Guntur", stipendMin: 5000 },
];

const INTERNSHIPS = [
  { id: "I001", title: "Data Science Intern", company: "BrightWave Analytics", domain: "Data Science", skills: ["Python", "Machine Learning", "Statistics", "SQL"], location: "Bangalore", stipend: 15000, minCgpa: 7.5, duration: 6 },
  { id: "I002", title: "Frontend Developer Intern", company: "PixelForge Studios", domain: "Web Development", skills: ["React", "JavaScript", "HTML/CSS", "Git"], location: "Remote", stipend: 10000, minCgpa: 6.5, duration: 3 },
  { id: "I003", title: "Digital Marketing Intern", company: "Skyline Media Group", domain: "Digital Marketing", skills: ["SEO", "Content Writing", "Marketing", "Communication"], location: "Mumbai", stipend: 6000, minCgpa: 6.0, duration: 3 },
  { id: "I004", title: "ML Engineering Intern", company: "BlueOrbit AI", domain: "Data Science", skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning"], location: "Hyderabad", stipend: 20000, minCgpa: 8.0, duration: 6 },
  { id: "I005", title: "Business Analyst Intern", company: "Vertex Consulting", domain: "Business Analytics", skills: ["Excel", "SQL", "Tableau", "Data Analysis"], location: "Chennai", stipend: 8000, minCgpa: 7.0, duration: 3 },
  { id: "I006", title: "Backend Developer Intern", company: "CoreStack Systems", domain: "Software Development", skills: ["Java", "SQL", "Git", "Linux"], location: "Pune", stipend: 9000, minCgpa: 6.5, duration: 6 },
  { id: "I007", title: "Financial Analyst Intern", company: "Quantum Finlabs", domain: "Finance", skills: ["Financial Modeling", "Excel", "Accounting"], location: "Delhi NCR", stipend: 14000, minCgpa: 7.5, duration: 3 },
  { id: "I008", title: "SOC Analyst Intern", company: "Falcon Cybersecurity", domain: "Cybersecurity", skills: ["Cybersecurity", "Networking", "Linux"], location: "Remote", stipend: 12000, minCgpa: 7.0, duration: 6 },
  { id: "I009", title: "Product Design Intern", company: "Nimbus Cloud Services", domain: "UI/UX Design", skills: ["UI/UX Design", "Figma", "Graphic Design"], location: "Bangalore", stipend: 7000, minCgpa: 6.5, duration: 3 },
  { id: "I010", title: "Full Stack Intern", company: "NovaTech Solutions", domain: "Software Development", skills: ["Python", "Django", "React", "SQL"], location: "Guntur", stipend: 6000, minCgpa: 6.0, duration: 3 },
];

// ---------------- Matching logic (mirrors the Python TF-IDF + rule-based hybrid) ----------------
function jaccard(a, b) {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function locationScore(a, b) {
  if (a === "Remote" || b === "Remote") return 1;
  return a === b ? 1 : 0.3;
}

function stipendScore(min, offered) {
  if (offered >= min) return 1;
  if (min === 0) return 1;
  return Math.max(0, offered / min);
}

function cgpaScore(studentCgpa, minCgpa) {
  if (studentCgpa >= minCgpa) return 1;
  return Math.max(0, 1 - (minCgpa - studentCgpa) / 2);
}

function scoreMatch(student, internship) {
  const skillSim = jaccard(student.skills, internship.skills);
  const domainBonus = student.domain === internship.domain ? 1 : 0.3;
  const loc = locationScore(student.location, internship.location);
  const stip = stipendScore(student.stipendMin, internship.stipend);
  const cgpa = cgpaScore(student.cgpa, internship.minCgpa);
  const final = 0.45 * skillSim + 0.2 * domainBonus + 0.15 * loc + 0.1 * stip + 0.1 * cgpa;
  return {
    score: Math.round(final * 100),
    skillPct: Math.round(skillSim * 100),
    sharedSkills: student.skills.filter((s) =>
      internship.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
    ),
  };
}

// ---------------- Match dial (signature visual element) ----------------
function MatchDial({ score }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#1F6F54" : score >= 45 ? "#D99A2B" : "#C1503B";

  return (
    <div style={{ position: "relative", width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#E4E8E1" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          fontSize: 15,
          color: "#1C2321",
        }}
      >
        {score}
      </div>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#ECEFEA", fg: "#5B6660" },
    match: { bg: "#EAF3EF", fg: "#1F6F54" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

export default function JunctionApp() {
  const [view, setView] = useState("student"); // "student" | "company"
  const [studentId, setStudentId] = useState(STUDENTS[0].id);
  const [internshipId, setInternshipId] = useState(INTERNSHIPS[0].id);

  const student = STUDENTS.find((s) => s.id === studentId);
  const internship = INTERNSHIPS.find((i) => i.id === internshipId);

  const studentResults = useMemo(() => {
    return INTERNSHIPS.map((i) => ({ internship: i, ...scoreMatch(student, i) })).sort(
      (a, b) => b.score - a.score
    );
  }, [studentId]);

  const companyResults = useMemo(() => {
    return STUDENTS.map((s) => ({ student: s, ...scoreMatch(s, internship) })).sort(
      (a, b) => b.score - a.score
    );
  }, [internshipId]);

  return (
    <div
      style={{
        background: "#ECEFEA",
        minHeight: "100%",
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: "#1C2321",
        padding: "28px 20px 48px",
      }}
    >
      <style>{FONT_IMPORT_STYLE}</style>

      {/* Header */}
      <div style={{ maxWidth: 880, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              fontStyle: "italic",
              fontSize: 30,
              letterSpacing: "-0.02em",
            }}
          >
            Junction
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8A938C" }}>
            /ˈdʒʌŋ(k)ʃ(ə)n/ — where profiles meet openings
          </span>
        </div>
        <p style={{ color: "#5B6660", fontSize: 14, maxWidth: 560, lineHeight: 1.5 }}>
          A two-sided matching engine: students get ranked internships, companies get ranked
          candidates. Every score below is computed live from skills, domain, location, stipend
          fit, and CGPA eligibility — the same weighting used in the Python recommender.
        </p>

        {/* View toggle */}
        <div
          style={{
            display: "inline-flex",
            marginTop: 18,
            border: "1px solid #D8DED6",
            borderRadius: 10,
            padding: 3,
            background: "#fff",
          }}
        >
          {["student", "company"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "8px 18px",
                borderRadius: 7,
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                background: view === v ? "#1F6F54" : "transparent",
                color: view === v ? "#fff" : "#5B6660",
                transition: "all 0.15s ease",
              }}
            >
              {v === "student" ? "I'm a Student" : "I'm Hiring"}
            </button>
          ))}
        </div>
      </div>

      {/* STUDENT VIEW */}
      {view === "student" && (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D8DED6",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <label style={{ fontSize: 12, color: "#5B6660", fontWeight: 600 }}>VIEWING AS</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{
                border: "1px solid #D8DED6",
                borderRadius: 8,
                padding: "8px 12px",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                flex: "1 1 220px",
                background: "#ECEFEA",
              }}
            >
              {STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.domain}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {student.skills.slice(0, 4).map((sk) => (
                <Pill key={sk}>{sk}</Pill>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {studentResults.map(({ internship: i, score, sharedSkills }) => (
              <div
                key={i.id}
                style={{
                  background: "#fff",
                  border: "1px solid #D8DED6",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <MatchDial score={score} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>
                      {i.title}
                    </span>
                    <span style={{ color: "#5B6660", fontSize: 13 }}>@ {i.company}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <Pill>{i.location}</Pill>
                    <Pill>₹{i.stipend.toLocaleString("en-IN")}/mo</Pill>
                    <Pill>{i.duration} mo</Pill>
                    {sharedSkills.length > 0 && (
                      <Pill tone="match">
                        {sharedSkills.length} shared skill{sharedSkills.length > 1 ? "s" : ""}
                      </Pill>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPANY VIEW */}
      {view === "company" && (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D8DED6",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <label style={{ fontSize: 12, color: "#5B6660", fontWeight: 600 }}>POSTING</label>
            <select
              value={internshipId}
              onChange={(e) => setInternshipId(e.target.value)}
              style={{
                border: "1px solid #D8DED6",
                borderRadius: 8,
                padding: "8px 12px",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                flex: "1 1 220px",
                background: "#ECEFEA",
              }}
            >
              {INTERNSHIPS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} — {i.company}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {internship.skills.map((sk) => (
                <Pill key={sk}>{sk}</Pill>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {companyResults.map(({ student: s, score, sharedSkills }) => (
              <div
                key={s.id}
                style={{
                  background: "#fff",
                  border: "1px solid #D8DED6",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <MatchDial score={score} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>
                      {s.name}
                    </span>
                    <span style={{ color: "#5B6660", fontSize: 13 }}>
                      {s.college} · {s.degree}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <Pill>CGPA {s.cgpa}</Pill>
                    <Pill>{s.location}</Pill>
                    {sharedSkills.length > 0 && (
                      <Pill tone="match">
                        {sharedSkills.length} shared skill{sharedSkills.length > 1 ? "s" : ""}
                      </Pill>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
