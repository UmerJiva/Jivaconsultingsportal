// pages/student/profile.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentLayout from '../../components/layout/StudentLayout';
import { CheckCircle, ArrowRight, ChevronDown, ChevronUp, Save } from 'lucide-react';

const SECTIONS = [
  { id:'personal',  label:'General Information',  icon:'👤' },
  { id:'address',   label:'Address Detail',        icon:'📍' },
  { id:'education', label:'Education History',     icon:'🎓' },
  { id:'tests',     label:'Test Scores',           icon:'📝' },
  { id:'visa',      label:'Visa & Study Permit',   icon:'🛂' },
];

const COUNTRIES = ['Pakistan','Canada','United Kingdom','United States','Australia','Germany','UAE','Turkey','Malaysia','Singapore','India','Bangladesh'];
const PROVINCES = {
  Pakistan: ['Punjab','Sindh','KPK','Balochistan','Islamabad'],
  Canada:   ['Ontario','British Columbia','Alberta','Quebec'],
  UK:       ['England','Scotland','Wales','Northern Ireland'],
};

function SectionBlock({ id, label, icon, active, done, onToggle, children }) {
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden mb-4 transition-all shadow-sm
      ${active ? 'border-brand-400' : done ? 'border-emerald-300' : 'border-slate-200'}`}>
      <button onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-slate-800">{label}</span>
          {done && !active && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        {active ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {active && (
        <div className="px-6 pb-6 border-t-2 border-brand-100 pt-5">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inp = "w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white transition-colors placeholder-slate-300";
const sel = "w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 bg-white transition-colors";

export default function StudentProfile() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [saved, setSaved]   = useState({});
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form state
  const [personal, setPersonal] = useState({ firstName:'', middleName:'', lastName:'', dob:'', language:'', country:'', passport:'', passportExpiry:'', marital:'', gender:'' });
  const [address,  setAddress]  = useState({ address:'', city:'', country:'', province:'', postal:'', email:'', phone:'' });
  const [education,setEducation]= useState({ level:'', institution:'', country:'', gradYear:'', gpa:'', gradeScale:'4.0' });
  const [tests,    setTests]    = useState({ ielts:'', ieltsDate:'', toefl:'', duolingo:'', sat:'', gre:'' });
  const [visa,     setVisa]     = useState({ hasVisa:'', visaCountry:'', visaType:'', visaExpiry:'', refusedVisa:'', studyPermit:'' });

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(d => {
      const p = d?.profile || {};
      setProfile(p);
      if (p.name) {
        const parts = p.name.split(' ');
        setPersonal(prev => ({...prev, firstName: parts[0]||'', lastName: parts[1]||''}));
      }
      if (p.phone) setAddress(prev => ({...prev, phone: p.phone, email: p.email||''}));
      if (p.gpa)   setEducation(prev => ({...prev, gpa: p.gpa}));
      if (p.ielts_score) setTests(prev => ({...prev, ielts: p.ielts_score}));
    });
    // Check URL section param
    if (router.query.section) setActiveSection(router.query.section);
  }, [router.query.section]);

  function toggle(id) { setActiveSection(s => s === id ? '' : id); }

  async function saveSection(sectionId, data) {
    setSaving(true);
    try {
      // Build update payload
      const payload = {};
      if (sectionId === 'personal') {
        payload.gpa = data.gpa || undefined;
      }
      if (sectionId === 'tests') {
        payload.ielts_score = data.ielts || undefined;
        payload.toefl_score = data.toefl || undefined;
      }
      if (sectionId === 'address') {
        payload.phone = data.phone || undefined;
      }

      if (Object.keys(payload).length > 0 && profile?.student_id) {
        await fetch(`/api/students/${profile.student_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setSaved(prev => ({...prev, [sectionId]: true}));
      // Move to next section
      const idx = SECTIONS.findIndex(s => s.id === sectionId);
      if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx+1].id);
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const SaveBtn = ({ sectionId, data }) => (
    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
      <button onClick={() => saveSection(sectionId, data)} disabled={saving}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm">
        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Save & Continue
      </button>
    </div>
  );

  // Sidebar nav
  const completedCount = Object.keys(saved).length;

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="text-5xl select-none">👥</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily:'Georgia,serif'}}>My Profile</h1>
            <p className="text-slate-500 text-sm mt-0.5">Fill in all sections to complete your profile</p>
          </div>
        </div>

        <div className="flex gap-6">

          {/* Left sidebar nav */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Sections</p>
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                const isDone   = saved[sec.id];
                return (
                  <button key={sec.id} onClick={() => toggle(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5
                      ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {isDone
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <ArrowRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                    }
                    {sec.label}
                  </button>
                );
              })}
              <div className="mt-3 pt-3 border-t border-slate-100 px-3">
                <div className="text-xs text-slate-500 mb-1">{completedCount} of {SECTIONS.length} complete</div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all"
                    style={{width:`${(completedCount/SECTIONS.length)*100}%`}} />
                </div>
              </div>
            </div>
          </div>

          {/* Form sections */}
          <div className="flex-1 min-w-0">

            {/* ── Personal Information ── */}
            <SectionBlock id="personal" label="Personal Information" icon="👤"
              active={activeSection==='personal'} done={saved.personal} onToggle={toggle}>
              <p className="text-xs text-slate-400 text-right mb-4">Registration Date: {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="First name" required>
                  <input className={inp} placeholder="Aisha" value={personal.firstName} onChange={e=>setPersonal(p=>({...p,firstName:e.target.value}))} />
                </Field>
                <Field label="Middle name">
                  <input className={inp} placeholder="(optional)" value={personal.middleName} onChange={e=>setPersonal(p=>({...p,middleName:e.target.value}))} />
                </Field>
                <Field label="Last name" required>
                  <input className={inp} placeholder="Khan" value={personal.lastName} onChange={e=>setPersonal(p=>({...p,lastName:e.target.value}))} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Date of birth" required>
                  <input type="date" className={inp} value={personal.dob} onChange={e=>setPersonal(p=>({...p,dob:e.target.value}))} />
                </Field>
                <Field label="First language" required>
                  <input className={inp} placeholder="Urdu" value={personal.language} onChange={e=>setPersonal(p=>({...p,language:e.target.value}))} />
                </Field>
                <Field label="Country of citizenship" required>
                  <select className={sel} value={personal.country} onChange={e=>setPersonal(p=>({...p,country:e.target.value}))}>
                    <option value="">Select</option>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Passport number" required>
                  <input className={inp} placeholder="AC1234567" value={personal.passport} onChange={e=>setPersonal(p=>({...p,passport:e.target.value}))} />
                </Field>
                <Field label="Passport expiry date">
                  <input type="date" className={inp} value={personal.passportExpiry} onChange={e=>setPersonal(p=>({...p,passportExpiry:e.target.value}))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-4">
                <Field label="Marital Status" required>
                  <div className="space-y-2 mt-1">
                    {['Single','Married','Divorced','Widowed'].map(opt=>(
                      <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="radio" name="marital" value={opt} checked={personal.marital===opt}
                          onChange={()=>setPersonal(p=>({...p,marital:opt}))}
                          className="w-4 h-4 accent-brand-600" />
                        <span className="text-sm text-slate-700 group-hover:text-brand-600 transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Gender" required>
                  <div className="space-y-2 mt-1">
                    {['Male','Female','Non-binary','Prefer not to say'].map(opt=>(
                      <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="radio" name="gender" value={opt} checked={personal.gender===opt}
                          onChange={()=>setPersonal(p=>({...p,gender:opt}))}
                          className="w-4 h-4 accent-brand-600" />
                        <span className="text-sm text-slate-700 group-hover:text-brand-600 transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
              <SaveBtn sectionId="personal" data={personal} />
            </SectionBlock>

            {/* ── Address Detail ── */}
            <SectionBlock id="address" label="Address Detail" icon="📍"
              active={activeSection==='address'} done={saved.address} onToggle={toggle}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Address" required>
                  <input className={inp} placeholder="House #12, Street 4" value={address.address} onChange={e=>setAddress(p=>({...p,address:e.target.value}))} />
                </Field>
                <Field label="City / Town" required>
                  <input className={inp} placeholder="Karachi" value={address.city} onChange={e=>setAddress(p=>({...p,city:e.target.value}))} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Country" required>
                  <select className={sel} value={address.country} onChange={e=>setAddress(p=>({...p,country:e.target.value,province:''}))}>
                    <option value="">Select</option>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Province / State" required>
                  <select className={sel} value={address.province} onChange={e=>setAddress(p=>({...p,province:e.target.value}))}>
                    <option value="">Select</option>
                    {(PROVINCES[address.country]||[]).map(p=><option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Postal / Zip code">
                  <input className={inp} placeholder="75500" value={address.postal} onChange={e=>setAddress(p=>({...p,postal:e.target.value}))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Email" required>
                  <input type="email" className={inp} placeholder="you@email.com" value={address.email} onChange={e=>setAddress(p=>({...p,email:e.target.value}))} />
                </Field>
                <Field label="Phone number" required>
                  <input className={inp} placeholder="+92 300 1234567" value={address.phone} onChange={e=>setAddress(p=>({...p,phone:e.target.value}))} />
                </Field>
              </div>
              <SaveBtn sectionId="address" data={address} />
            </SectionBlock>

            {/* ── Education History ── */}
            <SectionBlock id="education" label="Education History" icon="🎓"
              active={activeSection==='education'} done={saved.education} onToggle={toggle}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Highest education level" required>
                  <select className={sel} value={education.level} onChange={e=>setEducation(p=>({...p,level:e.target.value}))}>
                    <option value="">Select</option>
                    {['High School','Bachelor\'s Degree','Master\'s Degree','PhD','Diploma','Certificate'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Institution name" required>
                  <input className={inp} placeholder="University of Karachi" value={education.institution} onChange={e=>setEducation(p=>({...p,institution:e.target.value}))} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Country of study" required>
                  <select className={sel} value={education.country} onChange={e=>setEducation(p=>({...p,country:e.target.value}))}>
                    <option value="">Select</option>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Year of graduation" required>
                  <input type="number" className={inp} placeholder="2022" min="1990" max="2030" value={education.gradYear} onChange={e=>setEducation(p=>({...p,gradYear:e.target.value}))} />
                </Field>
                <Field label="GPA" required hint="Enter on 4.0 scale">
                  <input type="number" className={inp} placeholder="3.50" step="0.01" min="0" max="4" value={education.gpa} onChange={e=>setEducation(p=>({...p,gpa:e.target.value}))} />
                </Field>
              </div>
              <SaveBtn sectionId="education" data={education} />
            </SectionBlock>

            {/* ── Test Scores ── */}
            <SectionBlock id="tests" label="Test Scores" icon="📝"
              active={activeSection==='tests'} done={saved.tests} onToggle={toggle}>
              <p className="text-sm text-slate-500 mb-5">Add your English proficiency and standardized test scores.</p>
              <div className="space-y-4">
                {/* IELTS */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-800">IELTS</span>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Overall band score">
                      <input type="number" className={inp} placeholder="7.0" step="0.5" min="0" max="9" value={tests.ielts} onChange={e=>setTests(p=>({...p,ielts:e.target.value}))} />
                    </Field>
                    <Field label="Test date">
                      <input type="date" className={inp} value={tests.ieltsDate} onChange={e=>setTests(p=>({...p,ieltsDate:e.target.value}))} />
                    </Field>
                  </div>
                </div>
                {/* TOEFL */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-800 mb-3">TOEFL iBT</p>
                  <Field label="Total score">
                    <input type="number" className={inp} placeholder="100" min="0" max="120" value={tests.toefl} onChange={e=>setTests(p=>({...p,toefl:e.target.value}))} />
                  </Field>
                </div>
                {/* Duolingo */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-800 mb-3">Duolingo English Test</p>
                  <Field label="Overall score">
                    <input type="number" className={inp} placeholder="120" min="0" max="160" value={tests.duolingo} onChange={e=>setTests(p=>({...p,duolingo:e.target.value}))} />
                  </Field>
                </div>
              </div>
              <SaveBtn sectionId="tests" data={tests} />
            </SectionBlock>

            {/* ── Visa & Study Permit ── */}
            <SectionBlock id="visa" label="Visa & Study Permit" icon="🛂"
              active={activeSection==='visa'} done={saved.visa} onToggle={toggle}>
              <p className="text-sm text-slate-500 mb-5">Provide information about any existing visas or study permits.</p>
              <div className="space-y-5">
                <Field label="Do you currently hold a valid visa?" required>
                  <div className="flex gap-6 mt-2">
                    {['Yes','No'].map(opt=>(
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="hasVisa" value={opt} checked={visa.hasVisa===opt}
                          onChange={()=>setVisa(p=>({...p,hasVisa:opt}))}
                          className="w-4 h-4 accent-brand-600" />
                        <span className="text-sm text-slate-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                {visa.hasVisa === 'Yes' && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Field label="Country issued by">
                      <select className={sel} value={visa.visaCountry} onChange={e=>setVisa(p=>({...p,visaCountry:e.target.value}))}>
                        <option value="">Select</option>
                        {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Visa type">
                      <select className={sel} value={visa.visaType} onChange={e=>setVisa(p=>({...p,visaType:e.target.value}))}>
                        <option value="">Select</option>
                        {['Student Visa','Work Visa','Tourist Visa','Residence Permit','Other'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Expiry date">
                      <input type="date" className={inp} value={visa.visaExpiry} onChange={e=>setVisa(p=>({...p,visaExpiry:e.target.value}))} />
                    </Field>
                  </div>
                )}

                <Field label="Have you ever been refused a visa?" required>
                  <div className="flex gap-6 mt-2">
                    {['Yes','No'].map(opt=>(
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="refusedVisa" value={opt} checked={visa.refusedVisa===opt}
                          onChange={()=>setVisa(p=>({...p,refusedVisa:opt}))}
                          className="w-4 h-4 accent-brand-600" />
                        <span className="text-sm text-slate-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Do you currently hold a study permit?" required>
                  <div className="flex gap-6 mt-2">
                    {['Yes','No'].map(opt=>(
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="studyPermit" value={opt} checked={visa.studyPermit===opt}
                          onChange={()=>setVisa(p=>({...p,studyPermit:opt}))}
                          className="w-4 h-4 accent-brand-600" />
                        <span className="text-sm text-slate-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
              <SaveBtn sectionId="visa" data={visa} />
            </SectionBlock>

          </div>
        </div>
      </div>
    </StudentLayout>
  );
}