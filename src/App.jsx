import React, { useState, useEffect, useCallback } from "react";

/* Connects to the Flask backend. This should already point at your deployed
   Render backend — update it here if that URL ever changes. */
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

const AUTH_STORAGE_KEY = "junction_auth";

// ---------------- Shared small components ----------------
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
        background: props.disabled ? "#ECEFEA" : "#fff", color: "#1C2321" }} />
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
    fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: props.disabled ? 0.6 : 1 }}>{children}</button>;
}

function GhostButton({ children, ...props }) {
  return <button {...props} style={{ background: "transparent", color: "#1F6F54",
    border: "1px solid #1F6F54", borderRadius: 8, padding: "8px 16px",
    fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
    cursor: "pointer" }}>{children}</button>;
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div style={{ background: "#FBEAF0", color: "#4B1528", padding: "12px 16px",
    borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{message}</div>;
}

function ProfileCard({ kind, data }) {
  if (!data) return null;
  const rows = kind === "student"
    ? [["Name", data.name], ["College", data.college || "—"], ["Degree", data.degree || "—"],
       ["Year", data.year], ["CGPA", data.cgpa], ["Interest domain", data.interest_domain],
       ["Preferred location", data.preferred_location],
       ["Min. stipend", `₹${Number(data.preferred_stipend_min).toLocaleString("en-IN")}/mo`]]
    : [["Title", data.title], ["Company", data.company], ["Domain", data.domain],
       ["Location", data.location], ["Stipend", `₹${Number(data.stipend).toLocaleString("en-IN")}/mo`],
       ["Duration", `${data.duration_months} months`], ["Min. CGPA", data.min_cgpa]];
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

// ---------------- Auth screen (login / signup) ----------------
function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "signup-student" | "signup-company"
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [studentForm, setStudentForm] = useState({
    email: "", password: "", name: "", college: "", degree: "", year: 2, cgpa: 7.5,
    skills: "", interest_domain: DOMAINS[0], preferred_location: LOCATIONS[0],
    preferred_stipend_min: 5000,
  });
  const [companyForm, setCompanyForm] = useState({ email: "", password: "", company_name: "" });

  const setL = (k) => (e) => setLoginForm({ ...loginForm, [k]: e.target.value });
  const setS = (k) => (e) => setStudentForm({ ...studentForm, [k]: e.target.value });
  const setC = (k) => (e) => setCompanyForm({ ...companyForm, [k]: e.target.value });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { setError("Enter your email and password."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      onAuthenticated(data);
    } catch (e) {
      setError("Could not reach the backend. Is it running?");
    } finally { setSaving(false); }
  };

  const handleStudentSignup = async () => {
    if (!studentForm.email || !studentForm.password || !studentForm.name || !studentForm.skills) {
      setError("Please fill in at least email, password, name, and skills.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup/student`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...studentForm,
          year: Number(studentForm.year), cgpa: Number(studentForm.cgpa),
          preferred_stipend_min: Number(studentForm.preferred_stipend_min),
          skills: studentForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      onAuthenticated(data);
    } catch (e) {
      setError("Could not reach the backend. Is it running?");
    } finally { setSaving(false); }
  };

  const handleCompanySignup = async () => {
    if (!companyForm.email || !companyForm.password || !companyForm.company_name) {
      setError("Please fill in email, password, and company name.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup/company`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      onAuthenticated(data);
    } catch (e) {
      setError("Could not reach the backend. Is it running?");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#ECEFEA", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif",
      color: "#1C2321", padding: "48px 20px", display: "flex", justifyContent: "center" }}>
      <style>{FONT_IMPORT_STYLE}</style>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontStyle: "italic",
            fontSize: 32, letterSpacing: "-0.02em" }}>Junction</span>
          <p style={{ color: "#5B6660", fontSize: 14, marginTop: 6 }}>
            Explainable internship matching for students and companies.
          </p>
        </div>

        <div style={{ display: "inline-flex", marginBottom: 20, border: "1px solid #D8DED6",
          borderRadius: 10, padding: 3, background: "#fff" }}>
          {[["login", "Log in"], ["signup-student", "Sign up (Student)"], ["signup-company", "Sign up (Company)"]].map(
            ([key, label]) => (
              <button key={key} onClick={() => { setMode(key); setError(null); }} style={{ border: "none",
                cursor: "pointer", padding: "8px 14px", borderRadius: 7,
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 12.5,
                background: mode === key ? "#1F6F54" : "transparent", color: mode === key ? "#fff" : "#5B6660" }}>
                {label}
              </button>
            )
          )}
        </div>

        <ErrorBanner message={error} />

        <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
          padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

          {mode === "login" && (
            <>
              <TextInput label="Email" type="email" value={loginForm.email} onChange={setL("email")} />
              <TextInput label="Password" type="password" value={loginForm.password} onChange={setL("password")} />
              <PrimaryButton onClick={handleLogin} disabled={saving}>{saving ? "Logging in…" : "Log in"}</PrimaryButton>
            </>
          )}

          {mode === "signup-student" && (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TextInput label="Email" type="email" value={studentForm.email} onChange={setS("email")} />
                <TextInput label="Password" type="password" value={studentForm.password} onChange={setS("password")} />
              </div>
              <TextInput label="Full name" value={studentForm.name} onChange={setS("name")} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TextInput label="College" value={studentForm.college} onChange={setS("college")} />
                <TextInput label="Degree" value={studentForm.degree} onChange={setS("degree")} />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TextInput label="Year (1-4)" type="number" min="1" max="4" value={studentForm.year} onChange={setS("year")} />
                <TextInput label="CGPA" type="number" step="0.01" min="0" max="10" value={studentForm.cgpa} onChange={setS("cgpa")} />
                <TextInput label="Min. stipend (₹/mo)" type="number" value={studentForm.preferred_stipend_min} onChange={setS("preferred_stipend_min")} />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <SelectInput label="Interest domain" options={DOMAINS} value={studentForm.interest_domain} onChange={setS("interest_domain")} />
                <SelectInput label="Preferred location" options={LOCATIONS} value={studentForm.preferred_location} onChange={setS("preferred_location")} />
              </div>
              <TextInput label="Skills (comma separated)" value={studentForm.skills} onChange={setS("skills")} />
              <PrimaryButton onClick={handleStudentSignup} disabled={saving}>
                {saving ? "Creating account…" : "Create account & see matches"}
              </PrimaryButton>
            </>
          )}

          {mode === "signup-company" && (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TextInput label="Email" type="email" value={companyForm.email} onChange={setC("email")} />
                <TextInput label="Password" type="password" value={companyForm.password} onChange={setC("password")} />
              </div>
              <TextInput label="Company name" value={companyForm.company_name} onChange={setC("company_name")} />
              <PrimaryButton onClick={handleCompanySignup} disabled={saving}>
                {saving ? "Creating account…" : "Create company account"}
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Student dashboard ----------------
function StudentDashboard({ auth, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/students/${auth.student_id}`),
          fetch(`${API_BASE}/recommendations/student/${auth.student_id}?top_n=6`),
        ]);
        setProfile(await pRes.json());
        setResults(await rRes.json());
      } catch (e) {
        setError("Could not reach the backend. Is it running?");
      } finally { setLoading(false); }
    }
    load();
  }, [auth.student_id]);

  const apply = async (internshipId) => {
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: auth.student_id, internship_id: internshipId }),
      });
      if (!res.ok) throw new Error();
      setAppliedIds((prev) => new Set(prev).add(internshipId));
    } catch { alert("Could not submit application."); }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <ErrorBanner message={error} />
      <ProfileCard kind="student" data={profile} />
      {loading && <p style={{ color: "#5B6660", fontSize: 14 }}>Loading recommendations…</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((r) => {
          const already = appliedIds.has(r.internship_id);
          return (
            <div key={r.internship_id} style={{ background: "#fff", border: "1px solid #D8DED6",
              borderRadius: 14, padding: "16px 18px", display: "flex", gap: 18 }}>
              <MatchDial score={r.match_score} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
                  justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>{r.title}</span>{" "}
                    <span style={{ color: "#5B6660", fontSize: 13 }}>@ {r.company}</span>
                  </div>
                  {already ? <Pill tone="match">Applied ✓</Pill> : <GhostButton onClick={() => apply(r.internship_id)}>Apply</GhostButton>}
                </div>
                {r.shared_skills && r.shared_skills.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Pill tone="match">{r.shared_skills.length} shared skill{r.shared_skills.length > 1 ? "s" : ""}</Pill>
                  </div>
                )}
                {r.reasons && <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12.5, color: "#5B6660", lineHeight: 1.6 }}>
                  {r.reasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                </ul>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Company dashboard ----------------
function NewInternshipForm({ auth, onCreated }) {
  const [form, setForm] = useState({
    title: "", domain: DOMAINS[0], required_skills: "",
    location: LOCATIONS[0], stipend: 10000, duration_months: 3, min_cgpa: 6.5,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.required_skills) {
      alert("Please fill in at least a title and required skills.");
      return;
    }
    setSaving(true);
    const internship_id = "I" + Math.floor(1000 + Math.random() * 9000);
    try {
      const res = await fetch(`${API_BASE}/internships`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: auth.token, internship_id, company: auth.company_name, title: form.title,
          domain: form.domain,
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
          location: form.location, stipend: Number(form.stipend),
          duration_months: Number(form.duration_months), min_cgpa: Number(form.min_cgpa),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not save posting."); return; }
      onCreated(internship_id);
    } catch (e) {
      alert("Could not save posting. Is the backend running?");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
      padding: 18, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16 }}>
        Post a new internship as {auth.company_name}
      </span>
      <TextInput label="Internship title" value={form.title} onChange={set("title")} />
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

function CompanyDashboard({ auth, onLogout }) {
  const [myPostings, setMyPostings] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadPostings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/internships`);
      const all = await res.json();
      const mine = all.filter((i) => i.company === auth.company_name);
      setMyPostings(mine);
      if (mine.length && !selectedId) setSelectedId(mine[0].internship_id);
      return mine;
    } catch (e) {
      setError("Could not reach the backend. Is it running?");
      return [];
    }
  }, [auth.company_name, selectedId]);

  useEffect(() => { loadPostings(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!selectedId) { setResults([]); return; }
    async function loadRecs() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE}/recommendations/internship/${selectedId}?top_n=6`);
        setResults(await res.json());
      } catch { setError("Could not load candidates."); }
      finally { setLoading(false); }
    }
    loadRecs();
  }, [selectedId]);

  const currentPosting = myPostings.find((i) => i.internship_id === selectedId);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <ErrorBanner message={error} />
      <div style={{ marginBottom: 16 }}>
        <GhostButton onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New internship posting"}
        </GhostButton>
      </div>

      {showForm && (
        <NewInternshipForm auth={auth} onCreated={async (id) => {
          await loadPostings();
          setSelectedId(id);
          setShowForm(false);
        }} />
      )}

      {!showForm && myPostings.length === 0 && (
        <p style={{ color: "#5B6660", fontSize: 14 }}>
          You haven't posted any internships yet. Click "+ New internship posting" to create your first one.
        </p>
      )}

      {!showForm && myPostings.length > 0 && (
        <>
          <div style={{ background: "#fff", border: "1px solid #D8DED6", borderRadius: 14,
            padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center",
            gap: 14, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: "#5B6660", fontWeight: 600 }}>YOUR POSTING</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              style={{ border: "1px solid #D8DED6", borderRadius: 8, padding: "8px 12px",
                fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500,
                flex: "1 1 220px", background: "#ECEFEA", color: "#1C2321" }}>
              {myPostings.map((i) => <option key={i.internship_id} value={i.internship_id}>{i.title}</option>)}
            </select>
          </div>

          <ProfileCard kind="internship" data={currentPosting} />

          {loading && <p style={{ color: "#5B6660", fontSize: 14 }}>Loading candidates…</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((r) => (
              <div key={r.student_id} style={{ background: "#fff", border: "1px solid #D8DED6",
                borderRadius: 14, padding: "16px 18px", display: "flex", gap: 18 }}>
                <MatchDial score={r.match_score} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>{r.name}</span>
                    <span style={{ color: "#5B6660", fontSize: 13 }}>{r.college} · CGPA {r.cgpa}</span>
                  </div>
                  {r.shared_skills && r.shared_skills.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Pill tone="match">{r.shared_skills.length} shared skill{r.shared_skills.length > 1 ? "s" : ""}</Pill>
                    </div>
                  )}
                  {r.reasons && <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12.5, color: "#5B6660", lineHeight: 1.6 }}>
                    {r.reasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                  </ul>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Root app ----------------
export default function JunctionApp() {
  const [auth, setAuth] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try { setAuth(JSON.parse(stored)); } catch { /* ignore corrupt storage */ }
    }
    setCheckedStorage(true);
  }, []);

  const handleAuthenticated = (data) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
  };

  const handleLogout = async () => {
    if (auth?.token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: auth.token }),
        });
      } catch { /* ignore network errors on logout */ }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  };

  if (!checkedStorage) return null;
  if (!auth) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  return (
    <div style={{ background: "#ECEFEA", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif",
      color: "#1C2321", padding: "28px 20px 48px" }}>
      <style>{FONT_IMPORT_STYLE}</style>

      <div style={{ maxWidth: 880, margin: "0 auto 28px", display: "flex",
        justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontStyle: "italic",
            fontSize: 30, letterSpacing: "-0.02em" }}>Junction</span>
          <p style={{ color: "#5B6660", fontSize: 14, marginTop: 4 }}>
            {auth.role === "student"
              ? "Your ranked, explainable internship matches."
              : `Posting and reviewing candidates as ${auth.company_name}.`}
          </p>
        </div>
        <GhostButton onClick={handleLogout}>Log out</GhostButton>
      </div>

      {auth.role === "student"
        ? <StudentDashboard auth={auth} onLogout={handleLogout} />
        : <CompanyDashboard auth={auth} onLogout={handleLogout} />}
    </div>
  );
}

