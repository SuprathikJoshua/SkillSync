import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import DashboardNavbar from "../components/Dashboard/DashboardNavbar.jsx";
import Sidebar from "../components/Dashboard/SideBar.jsx";
import FeedbackModal from "../components/Dashboard/FeedbackModal.jsx";

const statusStyle = (s) => ({
  scheduled: { color:"#818cf8", bg:"rgba(129,140,248,0.12)" },
  completed:  { color:"#34d399", bg:"rgba(52,211,153,0.12)"  },
  cancelled:  { color:"#f87171", bg:"rgba(248,113,113,0.12)" },
}[s] || { color:"var(--text-muted)", bg:"var(--bg-secondary)" });

const inp = { width:"100%", marginTop:"0.25rem", padding:"0.7rem 1rem", borderRadius:"0.75rem", border:"1px solid var(--border)", backgroundColor:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" };

const SessionsPage = () => {
  const [user, setUser]     = useState(null);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers]   = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [form, setForm] = useState({ teacherId:"", learnerId:"", skillId:"", startTime:"", endTime:"", meetLink:"" });

  useEffect(() => {
    Promise.all([API.get("/auth/current-user"), API.get("/sessions"), API.get("/users"), API.get("/skills")])
      .then(([u,s,us,sk]) => { setUser(u.data.data); setSessions(s.data.data||[]); setUsers(us.data.data||[]); setSkills(sk.data.data||[]); })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.teacherId||!form.learnerId||!form.skillId||!form.startTime||!form.endTime) { toast.error("Fill all required fields"); return; }
    try {
      const res = await API.post("/sessions", form);
      setSessions([res.data.data, ...sessions]);
      setShowModal(false);
      setForm({ teacherId:"", learnerId:"", skillId:"", startTime:"", endTime:"", meetLink:"" });
      toast.success("Session created!");
    } catch(e) { toast.error(e.response?.data?.message||"Failed"); }
  };

  const handleStatus = async (id, status) => {
    try {
      const res = await API.put(`/sessions/${id}/status`, { status });
      setSessions(sessions.map(s => s._id===id ? res.data.data : s));
      toast.success(`Session ${status}!`);
    } catch { toast.error("Failed to update"); }
  };

  const tabs = ["all","scheduled","completed","cancelled"];
  const filtered = activeTab==="all" ? sessions : sessions.filter(s=>s.status===activeTab);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:"var(--bg-primary)"}}><p className="text-secondary">Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{backgroundColor:"var(--bg-primary)"}}>
      <DashboardNavbar user={user}/>
      <Sidebar/>
      <main style={{paddingTop:"4rem",paddingLeft:"15rem",minHeight:"100vh"}}>
        <div style={{background:"linear-gradient(135deg,rgba(79,70,229,0.15) 0%,rgba(124,58,237,0.08) 100%)",borderBottom:"1px solid var(--border)",padding:"2rem 2.5rem 1.5rem"}}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-primary">Sessions</h1>
              <p className="text-secondary mt-1 text-sm">Schedule and manage your learning sessions</p>
            </div>
            <button onClick={()=>setShowModal(true)} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",cursor:"pointer"}}>
              + New Session
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {["scheduled","completed","cancelled"].map(s=>{
              const {color,bg} = statusStyle(s);
              return <div key={s} className="rounded-xl p-3 text-center" style={{backgroundColor:bg,border:`1px solid ${color}22`}}>
                <p className="text-xl font-bold" style={{color}}>{sessions.filter(x=>x.status===s).length}</p>
                <p className="text-xs text-secondary capitalize mt-0.5">{s}</p>
              </div>;
            })}
          </div>
        </div>
        <div className="p-6 max-w-5xl space-y-5">

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)} className="px-4 py-2 rounded-xl text-sm font-medium capitalize"
                style={activeTab===tab ? {background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"white",border:"none",cursor:"pointer"} : {backgroundColor:"var(--bg-card)",color:"var(--text-secondary)",border:"1px solid var(--border)",cursor:"pointer"}}>
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="card rounded-2xl overflow-hidden">
            {filtered.length===0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-secondary font-medium">No sessions found</p>
                <button onClick={()=>setShowModal(true)} className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",cursor:"pointer"}}>
                  Create Session
                </button>
              </div>
            ) : (
              <div>
                {filtered.map((s,i)=>{
                  const {color,bg} = statusStyle(s.status);
                  return (
                    <div key={s._id} className="flex items-center justify-between p-5 transition-colors"
                      style={{borderBottom: i<filtered.length-1?"1px solid var(--border)":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor="var(--bg-secondary)"}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:bg}}>
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-sm">{typeof s.skillId==="object" ? s.skillId?.name : "Unknown Skill"}</p>
                          <p className="text-xs text-secondary mt-0.5">{s.teacherId?.fullName||"?"} → {s.learnerId?.fullName||"?"}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(s.startTime).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} · {new Date(s.startTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {s.meetLink && (
                          <a href={s.meetLink} target="_blank" rel="noreferrer"
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{backgroundColor:"rgba(52,211,153,0.12)",color:"#34d399",textDecoration:"none"}}>
                            🎥 Join
                          </a>
                        )}
                        <span className="text-xs px-3 py-1 rounded-full font-medium capitalize" style={{backgroundColor:bg,color}}>{s.status}</span>
                        {s.status==="scheduled" && (
                          <div className="flex gap-1.5">
                            <button onClick={()=>handleStatus(s._id,"completed")} className="text-xs px-2.5 py-1 rounded-lg text-white" style={{backgroundColor:"#10b981",border:"none",cursor:"pointer"}}>✓ Done</button>
                            <button onClick={()=>handleStatus(s._id,"cancelled")} className="text-xs px-2.5 py-1 rounded-lg text-white" style={{backgroundColor:"#ef4444",border:"none",cursor:"pointer"}}>✕ Cancel</button>
                          </div>
                        )}
                        {s.status==="completed" && (
                          <button onClick={()=>setFeedbackSession(s)} className="text-xs px-3 py-1 rounded-lg text-white" style={{backgroundColor:"#4f46e5",border:"none",cursor:"pointer"}}>★ Rate</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor:"rgba(0,0,0,0.7)"}}>
            <div className="card rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary">Create Session</h2>
                <button onClick={()=>setShowModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)",fontSize:"20px"}}>×</button>
              </div>
              <div className="space-y-4">
                {[{label:"Teacher",key:"teacherId",opts:users},{label:"Learner",key:"learnerId",opts:users}].map(({label,key,opts})=>(
                  <div key={key}>
                    <label style={{fontSize:"0.875rem",color:"var(--text-secondary)",display:"block",marginBottom:"0.25rem"}}>{label}</label>
                    <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={inp}>
                      <option value="">Select {label.toLowerCase()}...</option>
                      {opts.map(u=><option key={u._id} value={u._id}>{u.fullName} (@{u.username})</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:"0.875rem",color:"var(--text-secondary)",display:"block",marginBottom:"0.25rem"}}>Skill</label>
                  <select value={form.skillId} onChange={e=>setForm({...form,skillId:e.target.value})} style={inp}>
                    <option value="">Select skill...</option>
                    {skills.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{fontSize:"0.875rem",color:"var(--text-secondary)",display:"block",marginBottom:"0.25rem"}}>Start Time</label>
                    <input type="datetime-local" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} style={inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:"0.875rem",color:"var(--text-secondary)",display:"block",marginBottom:"0.25rem"}}>End Time</label>
                    <input type="datetime-local" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} style={inp}/>
                  </div>
                </div>
                <div>
                  <label style={{fontSize:"0.875rem",color:"var(--text-secondary)",display:"block",marginBottom:"0.25rem"}}>Meet Link <span style={{color:"var(--text-muted)",fontWeight:400}}>(optional — Zoom/Google Meet)</span></label>
                  <input type="url" value={form.meetLink} onChange={e=>setForm({...form,meetLink:e.target.value})} placeholder="https://meet.google.com/..." style={inp}/>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setShowModal(false)} className="flex-1 py-3 rounded-xl text-secondary text-sm" style={{border:"1px solid var(--border)",background:"none",cursor:"pointer"}}>Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",cursor:"pointer"}}>Create Session</button>
              </div>
            </div>
          </div>
        )}
        {feedbackSession && <FeedbackModal session={feedbackSession} currentUserId={user?._id} onClose={()=>setFeedbackSession(null)} onSubmitted={()=>setFeedbackSession(null)}/>}
      </main>
    </div>
  );
};
export default SessionsPage;
