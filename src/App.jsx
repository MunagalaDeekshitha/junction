import React, { useState, useEffect, useCallback } from "react";

/* Connects to the Flask backend. Change API_BASE to your deployed backend
   URL once you host it online (see DEPLOY.md). */
   const API_BASE = "https://ai-internship-recommendation-system-mh2p.onrender.com/api";

const FONT_IMPORT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const DOMAINS = ["Software Development", "Data Science", "Web Development", "UI/UX Design",
  "Digital Marketing", "Finance", "Human Resources", "Mechanical Engineering",
  "Electrical Engineering", "Business Analytics", "Product Management", "Content & Media",
  "Cybersecurity", "Sales", "Operations"];

const LOCATIONS = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi NCR",
  "Remote", "Guntur", "Vijayawada", "Kolkata"];

function MatchDial({ score }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#1F6F54" : score >= 45 ? "#D99A2B" : "#C1503B";
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#E4E8E1" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
        fontSize: 15, color: "#1C2321" }}>{score}</div>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = { neutral: { bg: "#ECEFEA", fg: "#5B6660" }, match: { bg: "#EAF3EF", fg: "#1F6F54" } };
  const t = tones[tone];
  return <span style={{ background: t.bg, color: t.fg, fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 12, fontWeight: 500, padding: "3px 9px", borderRadius: 999, display: "inline-block" }}>
    {children}</span>;
}

function TextInput({ label, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12,
      color: "#5B6660", fontWeight: 600, flex: "1 1 160px" }}>
      {label}
      <input {...props} style={{ border: "1px solid #D8DED6", borderRadius: 8, padding: "8px 10px",
        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 400,
        background: "#fff", color: "#1C2321" }} />
    </label>
  );
}

function SelectInput({ label, options, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12,
      color: "#5B6660", fontWeight: 600, flex: "1 1 160px" }}>
      {label}
      <select {...props} style={{ border: "1px solid #D8DED6", borderRadius: 8, padding: "8px 10px",
        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, background: "#fff", color: "#1C2321" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function PrimaryButton({ children, ...props }) {
  return <button {...props} style={{ background: "#1F6F54", color: "#fff", border: "none",
    borderRadius: 8, padding: "9px 18px", fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{children}</button>;
}

function GhostButton({ children, ...props }) {
  return <button {...props} style={{ background: "transparent", color: "#1F6F54",
    border: "1px solid #1F6F54", borderRadius: 8, padding: "8px 16px",
    fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
    cursor: "pointer" }}>{children}</button>;
}

function NewStudentForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "", college: "", degree: "", year: 2, cgpa: 7.5,
    skills: "", interest_domain: DOMAINS[0], preferred_location: LOCATIONS[0],
    preferred_stipend_min: 5000,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name || !form.skills) { alert("Please fill in at least name and skills."); return; }
    setSaving(true);
    const student_id = "S" + Math.floor(1000 + Math.random() * 9000);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id, name: form.name, college: form.college, degree: form.degree,
          year: Number(form.year), cgpa: Number(form.cgpa),
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          interest_domain: form.interest_domain, preferred_location: form.preferred_location,
          preferred_stipend_min: Number(form.preferred_stipend_min),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      onCreated(student_id);
    } catch (e) {
      alert("Could not save profile. Is the backend running?");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
      padding: 18, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16 }}>
        Create your student profile
      </span>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TextInput label="Full name" value={form.name} onChange={set("name")} />
        <TextInput label="College" value={form.college} onChange={set("college")} />
        <TextInput label="Degree" value={form.degree} onChange={set("degree")} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TextInput label="Year (1-4)" type="number" min="1" max="4" value={form.year} onChange={set("year")} />
        <TextInput label="CGPA" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set("cgpa")} />
        <TextInput label="Min. stipend (₹/mo)" type="number" value={form.preferred_stipend_min} onChange={set("preferred_stipend_min")} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SelectInput label="Interest domain" options={DOMAINS} value={form.interest_domain} onChange={set("interest_domain")} />
        <SelectInput label="Preferred location" options={LOCATIONS} value={form.preferred_location} onChange={set("preferred_location")} />
      </div>
      <TextInput label="Skills (comma separated, e.g. Python, SQL, Excel)" value={form.skills} onChange={set("skills")} />
      <div><PrimaryButton onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create profile & see matches"}</PrimaryButton></div>
    </div>
  );
}

function NewInternshipForm({ onCreated }) {
  const [form, setForm] = useState({
    company: "", title: "", domain: DOMAINS[0], required_skills: "",
    location: LOCATIONS[0], stipend: 10000, duration_months: 3, min_cgpa: 6.5,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.company || !form.title || !form.required_skills) {
      alert("Please fill in at least company, title, and required skills.");
      return;
    }
    setSaving(true);
    const internship_id = "I" + Math.floor(1000 + Math.random() * 9000);
    try {
      const res = await fetch(`${API_BASE}/internships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internship_id, company: form.company, title: form.title, domain: form.domain,
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
          location: form.location, stipend: Number(form.stipend),
          duration_months: Number(form.duration_months), min_cgpa: Number(form.min_cgpa),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      onCreated(internship_id);
    } catch (e) {
      alert("Could not save posting. Is the backend running?");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
      padding: 18, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16 }}>
        Post a new internship
      </span>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TextInput label="Company name" value={form.company} onChange={set("company")} />
        <TextInput label="Internship title" value={form.title} onChange={set("title")} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SelectInput label="Domain" options={DOMAINS} value={form.domain} onChange={set("domain")} />
        <SelectInput label="Location" options={LOCATIONS} value={form.location} onChange={set("location")} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TextInput label="Stipend (₹/mo)" type="number" value={form.stipend} onChange={set("stipend")} />
        <TextInput label="Duration (months)" type="number" value={form.duration_months} onChange={set("duration_months")} />
        <TextInput label="Min. CGPA" type="number" step="0.01" value={form.min_cgpa} onChange={set("min_cgpa")} />
      </div>
      <TextInput label="Required skills (comma separated)" value={form.required_skills} onChange={set("required_skills")} />
      <div><PrimaryButton onClick={submit} disabled={saving}>{saving ? "Saving…" : "Post & see candidates"}</PrimaryButton></div>
    </div>
  );
}

function ProfileCard({ kind, data }) {
  if (!data) return null;

  const rows =
    kind === "student"
      ? [
          ["Name", data.name],
          ["College", data.college || "—"],
          ["Degree", data.degree || "—"],
          ["Year", data.year],
          ["CGPA", data.cgpa],
          ["Interest domain", data.interest_domain],
          ["Preferred location", data.preferred_location],
          ["Min. stipend", `₹${Number(data.preferred_stipend_min).toLocaleString("en-IN")}/mo`],
        ]
      : [
          ["Title", data.title],
          ["Company", data.company],
          ["Domain", data.domain],
          ["Location", data.location],
          ["Stipend", `₹${Number(data.stipend).toLocaleString("en-IN")}/mo`],
          ["Duration", `${data.duration_months} months`],
          ["Min. CGPA", data.min_cgpa],
        ];

  const skills = kind === "student" ? data.skills : data.required_skills;

  return (
    <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
      padding: "16px 20px", marginBottom: 20 }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15,
        display: "block", marginBottom: 10 }}>
        {kind === "student" ? "Your profile" : "This posting"}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "6px 20px", marginBottom: 12 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ fontSize: 13 }}>
            <span style={{ color: "#8A938C" }}>{label}: </span>
            <span style={{ color: "#1C2321", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
      <div>
        <span style={{ color: "#8A938C", fontSize: 13 }}>Skills: </span>
        <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {skills.split(";").map((sk) => <Pill key={sk}>{sk}</Pill>)}
        </div>
      </div>
    </div>
  );
}

export default function JunctionApp() {
  const [view, setView] = useState("student");
  const [students, setStudents] = useState([]);
  const [internships, setInternships] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [internshipId, setInternshipId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());

  const loadLists = useCallback(async () => {
    try {
      const [sRes, iRes] = await Promise.all([fetch(`${API_BASE}/students`), fetch(`${API_BASE}/internships`)]);
      const sData = await sRes.json();
      const iData = await iRes.json();
      setStudents(sData);
      setInternships(iData);
      return { sData, iData };
    } catch (e) {
      setError("Could not reach the backend. Is app.py running at http://127.0.0.1:5001 ?");
      return { sData: [], iData: [] };
    }
  }, []);

  useEffect(() => {
    loadLists().then(({ sData, iData }) => {
      if (sData.length) setStudentId(sData[0].student_id);
      if (iData.length) setInternshipId(iData[0].internship_id);
    });
  }, [loadLists]);

  const fetchStudentRecs = useCallback(async (id) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/recommendations/student/${id}?top_n=6`);
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch { setError("Could not load recommendations. Is app.py running?"); }
    finally { setLoading(false); }
  }, []);

  const fetchInternshipRecs = useCallback(async (id) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/recommendations/internship/${id}?top_n=6`);
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch { setError("Could not load recommendations. Is app.py running?"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (view === "student" && studentId) fetchStudentRecs(studentId); }, [view, studentId, fetchStudentRecs]);
  useEffect(() => { if (view === "company" && internshipId) fetchInternshipRecs(internshipId); }, [view, internshipId, fetchInternshipRecs]);

  const currentStudent = students.find((s) => s.student_id === studentId);
  const currentInternship = internships.find((i) => i.internship_id === internshipId);

  const apply = async (targetInternshipId) => {
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, internship_id: targetInternshipId }),
      });
      if (!res.ok) throw new Error();
      setAppliedIds((prev) => new Set(prev).add(targetInternshipId));
    } catch {
      alert("Could not submit application. Is the backend running?");
    }
  };

  return (
    <div style={{ background: "#ECEFEA", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif",
      color: "#1C2321", padding: "28px 20px 48px" }}>
      <style>{FONT_IMPORT_STYLE}</style>

      <div style={{ maxWidth: 880, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontStyle: "italic",
            fontSize: 30, letterSpacing: "-0.02em" }}>Junction</span>
        </div>
        <p style={{ color: "#5B6660", fontSize: 14, maxWidth: 560, lineHeight: 1.5 }}>
          Create a profile (or a posting), and get ranked, explainable matches instantly.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", border: "1px solid #D8DED6", borderRadius: 10, padding: 3, background: "#fff" }}>
            {["student", "company"].map((v) => (
              <button key={v} onClick={() => { setView(v); setShowForm(false); }} style={{ border: "none",
                cursor: "pointer", padding: "8px 18px", borderRadius: 7,
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
                background: view === v ? "#1F6F54" : "transparent", color: view === v ? "#fff" : "#5B6660" }}>
                {v === "student" ? "I'm a Student" : "I'm Hiring"}
              </button>
            ))}
          </div>
          <GhostButton onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : view === "student" ? "+ New student profile" : "+ New internship posting"}
          </GhostButton>
        </div>
      </div>

      {error && <div style={{ maxWidth: 880, margin: "0 auto 20px", background: "#FBEAF0",
        color: "#4B1528", padding: "14px 18px", borderRadius: 10, fontSize: 13 }}>{error}</div>}

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {showForm && view === "student" && (
          <NewStudentForm onCreated={async (id) => { await loadLists(); setStudentId(id); setShowForm(false); }} />
        )}
        {showForm && view === "company" && (
          <NewInternshipForm onCreated={async (id) => { await loadLists(); setInternshipId(id); setShowForm(false); }} />
        )}

        {!showForm && (
          <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
            padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {view === "student" ? (
              <>
                <label style={{ fontSize: 12, color: "#5B6660", fontWeight: 600 }}>VIEWING AS</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  style={{ border: "1px solid #D8DED6", borderRadius: 8, padding: "8px 12px",
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500,
                    flex: "1 1 220px", background: "#ECEFEA", color: "#1C2321" }}>
                  {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} — {s.interest_domain}</option>)}
                </select>
              </>
            ) : (
              <>
                <label style={{ fontSize: 12, color: "#5B6660", fontWeight: 600 }}>POSTING</label>
                <select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}
                  style={{ border: "1px solid #D8DED6", borderRadius: 8, padding: "8px 12px",
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500,
                    flex: "1 1 220px", background: "#ECEFEA", color: "#1C2321" }}>
                  {internships.map((i) => <option key={i.internship_id} value={i.internship_id}>{i.title} — {i.company}</option>)}
                </select>
              </>
            )}
          </div>
        )}

        {!showForm && view === "student" && <ProfileCard kind="student" data={currentStudent} />}
        {!showForm && view === "company" && <ProfileCard kind="internship" data={currentInternship} />}

        {loading && <p style={{ color: "#5B6660", fontSize: 14 }}>Loading recommendations…</p>}

        {!showForm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((r) => {
              const isStudentView = view === "student";
              const title = isStudentView ? r.title : r.name;
              const subtitle = isStudentView ? `@ ${r.company}` : `${r.college} · CGPA ${r.cgpa}`;
              const key = isStudentView ? r.internship_id : r.student_id;
              const already = isStudentView && appliedIds.has(r.internship_id);

              return (
                <div key={key} style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
                  padding: "16px 18px", display: "flex", gap: 18 }}>
                  <MatchDial score={r.match_score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>{title}</span>{" "}
                        <span style={{ color: "#5B6660", fontSize: 13 }}>{subtitle}</span>
                      </div>
                      {isStudentView && (
                        already ? <Pill tone="match">Applied ✓</Pill> : <GhostButton onClick={() => apply(r.internship_id)}>Apply</GhostButton>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {r.shared_skills && r.shared_skills.length > 0 && (
                        <Pill tone="match">{r.shared_skills.length} shared skill{r.shared_skills.length > 1 ? "s" : ""}</Pill>
                      )}
                    </div>
                    {r.reasons && <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12.5, color: "#5B6660", lineHeight: 1.6 }}>
                      {r.reasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                    </ul>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
