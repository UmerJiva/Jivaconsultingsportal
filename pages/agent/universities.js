// pages/agent/universities.js — Programs search with ApplyBoard-style filters
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import ApplicationWizard from '../../components/ApplicationWizard';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Check, Filter, RotateCcw,
  Zap, Star, BookOpen, Globe, Calendar, DollarSign,
  GraduationCap, Tag, Building2, Clock
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────
const LIMIT = 12;

const PROGRAM_LEVELS = {
  'Undergraduate': [
    '1-Year Post-Secondary Certificate',
    '2-Year Undergraduate Diploma',
    '3-Year Undergraduate Advanced Diploma',
    "3-Year Bachelor's Degree",
    'Top-up Degree',
    "4-Year Bachelor's Degree",
    'Integrated Masters',
  ],
  'Post-graduate': [
    'Postgraduate Certificate',
    'Postgraduate Diploma',
    "Master's Degree",
    'Doctoral / PhD',
    'Non-Credential',
  ],
  'Elementary and High School': [
    'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
    'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
  ],
};

// Flat list for DB query mapping
const LEVEL_MAP = {
  "1-Year Post-Secondary Certificate": "Certificate",
  "2-Year Undergraduate Diploma": "Diploma",
  "3-Year Undergraduate Advanced Diploma": "Diploma",
  "3-Year Bachelor's Degree": "Bachelor",
  "Top-up Degree": "Bachelor",
  "4-Year Bachelor's Degree": "Bachelor",
  "Integrated Masters": "Master",
  "Postgraduate Certificate": "Certificate",
  "Postgraduate Diploma": "Diploma",
  "Master's Degree": "Master",
  "Doctoral / PhD": "PhD",
  "Non-Credential": "Other",
};

const FIELDS_OF_STUDY = [
  'Business & Management','Computer Science & IT','Engineering','Health Sciences',
  'Arts & Humanities','Social Sciences','Law','Education','Architecture & Design',
  'Agriculture','Media & Communications','Environmental Studies','Mathematics',
  'Tourism & Hospitality','Finance & Accounting','Psychology','Pharmacy',
  'Nursing','Data Science & AI','Cybersecurity',
];

const PROGRAM_TAGS = [
  'Fast Acceptance','High Job Demand','Incentivized','Instant Offer',
  'Instant Submission','Loan Available','New Program','No UK Interview',
  'Popular','Prime','Scholarships Available','Top',
];

const TAG_COLORS = {
  'High Job Demand':       'bg-teal-50 text-teal-700 border-teal-200',
  'Scholarships Available':'bg-green-50 text-green-700 border-green-200',
  'No Visa Cap':           'bg-blue-50 text-blue-700 border-blue-200',
  'Loan Available':        'bg-purple-50 text-purple-700 border-purple-200',
  'Prime':                 'bg-sky-50 text-sky-700 border-sky-200',
  'Incentivized':          'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Popular':               'bg-pink-50 text-pink-700 border-pink-200',
  'Fast Acceptance':       'bg-amber-50 text-amber-700 border-amber-200',
  'Instant Submission':    'bg-brand-50 text-brand-700 border-brand-200',
  'Instant Offer':         'bg-teal-50 text-teal-600 border-teal-200',
  'Top':                   'bg-orange-50 text-orange-700 border-orange-200',
  'New Program':           'bg-violet-50 text-violet-700 border-violet-200',
  'No UK Interview':       'bg-slate-50 text-slate-600 border-slate-200',
};

// Generate intakes: next 8 months + next 2 years
function generateIntakes() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const result = [];
  for (let i = 0; i < 16; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i);
    result.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
}

// ── FilterSection component ───────────────────────────────────
function FilterSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 px-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-slate-500 shrink-0"/>
          <span className="text-sm font-bold text-slate-700">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

// ── CheckItem ─────────────────────────────────────────────────
function CheckItem({ label, checked, onChange, count }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <div onClick={onChange}
        className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer
          ${checked ? 'bg-brand-600 border-brand-600' : 'border-slate-300 group-hover:border-brand-400'}`}
        style={{width:'18px',height:'18px'}}>
        {checked && <Check className="w-3 h-3 text-white"/>}
      </div>
      <span className={`text-sm flex-1 ${checked ? 'text-brand-700 font-semibold' : 'text-slate-600'}`}>{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
    </label>
  );
}

// ── Program Card ──────────────────────────────────────────────
function ProgramCard({ prog, onApply }) {
  const router = useRouter();
  const tags    = (prog.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const intakes = (prog.available_intakes||'').split(',').map(i=>i.trim()).filter(Boolean);
  const fee     = prog.tuition_fee ? `${prog.currency||'$'} ${Number(prog.tuition_fee).toLocaleString()}` : 'Contact';
  const appFee  = prog.application_fee == 0 ? 'Free' : `${prog.app_fee_currency||'$'} ${prog.application_fee}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all relative flex flex-col group">
      {/* Badges */}
      {(prog.instant_offer || prog.instant_submission) && (
        <div className="absolute -top-3 left-4 flex gap-1.5 z-10">
          {prog.instant_submission && (
            <span className="px-2.5 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full shadow-sm">Instant Submission</span>
          )}
          {prog.instant_offer && (
            <span className="px-2.5 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full shadow-sm">Instant Offer</span>
          )}
        </div>
      )}

      <div className="p-5 pt-6 flex-1">
        {/* University */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-700 to-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {prog.logo_initials || prog.university_name?.[0] || 'U'}
          </div>
          <button onClick={() => router.push(`/agent/university/${prog.university_id}`)}
            className="text-sm font-semibold text-brand-600 hover:underline text-left leading-tight line-clamp-1">
            {prog.university_name}
          </button>
        </div>

        {/* Level */}
        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{prog.level}</div>

        {/* Name */}
        <h3 className="font-bold text-slate-800 text-[15px] leading-snug mb-3 cursor-pointer hover:text-brand-700 line-clamp-2"
          onClick={() => router.push(`/agent/program/${prog.id}`)}>
          {prog.name}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0,3).map(t => (
              <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[t]||'bg-slate-50 text-slate-600 border-slate-200'}`}>{t}</span>
            ))}
            {tags.length > 3 && <span className="text-[10px] text-slate-400 font-semibold self-center">+{tags.length-3}</span>}
          </div>
        )}

        {/* Details grid */}
        <div className="space-y-1.5 text-sm">
          {[
            ['Location', `${prog.campus_city||''} ${prog.country?`, ${prog.country}`:''}`.trim()],
            ['Tuition (1st year)', fee],
            ['Application fee', appFee],
            ['Duration', prog.duration_text],
          ].filter(([,v])=>v).map(([k,v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{k}</span>
              <span className="text-slate-700 font-semibold text-xs text-right max-w-[55%] truncate">{v}</span>
            </div>
          ))}
        </div>

        {/* Intakes */}
        {intakes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Available Intakes</div>
            <div className="flex gap-1.5 flex-wrap">
              {intakes.slice(0,3).map(i => (
                <span key={i} className="text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full">{i}</span>
              ))}
              {intakes.length > 3 && <span className="text-[10px] text-slate-400 self-center">+{intakes.length-3} more</span>}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex gap-2">
        <button onClick={() => router.push(`/agent/program/${prog.id}`)}
          className="flex-1 py-2 rounded-xl border border-slate-200 hover:border-brand-300 text-slate-600 hover:text-brand-700 text-xs font-bold transition-colors">
          View Details
        </button>
        <button onClick={() => onApply(prog)}
          className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm">
          Apply Now
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ProgramsSearch() {
  const router  = useRouter();
  const [programs, setPrograms]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [applyProg, setApplyProg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter state
  const [search, setSearch]           = useState('');
  const [selectedLevels, setSelectedLevels]   = useState([]);
  const [selectedFields, setSelectedFields]   = useState([]);
  const [selectedIntakes, setSelectedIntakes] = useState([]);
  const [selectedTags, setSelectedTags]       = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [instantFilter, setInstantFilter]     = useState('');

  // Active filter tags (for pill display)
  const activeFilters = [
    ...selectedLevels.map(l => ({ key:'level', value:l, label:l })),
    ...selectedFields.map(f => ({ key:'field', value:f, label:f })),
    ...selectedIntakes.map(i => ({ key:'intake', value:i, label:i })),
    ...selectedTags.map(t => ({ key:'tag', value:t, label:t })),
    ...(selectedCountry ? [{ key:'country', value:selectedCountry, label:selectedCountry }] : []),
    ...(instantFilter ? [{ key:'instant', value:instantFilter, label: instantFilter==='submission'?'Instant Submission':'Instant Offer' }] : []),
  ];

  const totalPages = Math.ceil(total / LIMIT);
  const intakeOptions = generateIntakes();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Map display level names to DB values
      const dbLevel = selectedLevels.map(l => LEVEL_MAP[l] || l).join(',');
      const p = new URLSearchParams({
        page, limit: LIMIT,
        search,
        level:   dbLevel,
        country: selectedCountry,
        tag:     selectedTags[0] || '',      // API supports one tag for now
        field:   selectedFields[0] || '',
        intake:  selectedIntakes[0] || '',
        instant: instantFilter,
      });
      const d = await fetch(`/api/programs?${p}`).then(r => r.json());
      setPrograms(d.programs || []);
      setTotal(d.total || 0);
    } catch { setPrograms([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, search, selectedLevels, selectedFields, selectedIntakes, selectedTags, selectedCountry, instantFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const searchRef = useRef(null);
  function handleSearch(val) {
    setSearch(val);
    setPage(1);
  }

  function toggleLevel(level) {
    setSelectedLevels(prev => prev.includes(level) ? prev.filter(l=>l!==level) : [...prev, level]);
    setPage(1);
  }
  function toggleField(field) {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f=>f!==field) : [...prev, field]);
    setPage(1);
  }
  function toggleIntake(intake) {
    setSelectedIntakes(prev => prev.includes(intake) ? prev.filter(i=>i!==intake) : [...prev, intake]);
    setPage(1);
  }
  function toggleTag(tag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);
    setPage(1);
  }
  function removeFilter(f) {
    if (f.key==='level')   setSelectedLevels(p=>p.filter(v=>v!==f.value));
    if (f.key==='field')   setSelectedFields(p=>p.filter(v=>v!==f.value));
    if (f.key==='intake')  setSelectedIntakes(p=>p.filter(v=>v!==f.value));
    if (f.key==='tag')     setSelectedTags(p=>p.filter(v=>v!==f.value));
    if (f.key==='country') setSelectedCountry('');
    if (f.key==='instant') setInstantFilter('');
    setPage(1);
  }
  function clearAll() {
    setSelectedLevels([]); setSelectedFields([]); setSelectedIntakes([]);
    setSelectedTags([]); setSelectedCountry(''); setInstantFilter(''); setSearch(''); setPage(1);
  }

  return (
    <AdminLayout title="Programs">
      <div className="flex gap-0 -mx-4 -mt-2" style={{minHeight:'calc(100vh - 80px)'}}>

        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <div className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto" style={{maxHeight:'calc(100vh - 80px)', position:'sticky', top:0}}>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600"/>
                <span className="font-bold text-slate-800">All Filters</span>
                {activeFilters.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters.length}</span>
                )}
              </div>
              {activeFilters.length > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1 text-xs text-brand-600 font-bold hover:text-brand-800">
                  <RotateCcw className="w-3 h-3"/>Clear all
                </button>
              )}
            </div>

            {/* ── Program Level ── */}
            <FilterSection title="Program Level" icon={GraduationCap}>
              {Object.entries(PROGRAM_LEVELS).map(([group, levels]) => (
                <div key={group} className="mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{group}</div>
                  {levels.map(level => (
                    <CheckItem key={level} label={level} checked={selectedLevels.includes(level)} onChange={() => toggleLevel(level)}/>
                  ))}
                </div>
              ))}
            </FilterSection>

            {/* ── Field of Study ── */}
            <FilterSection title="Field of Study" icon={BookOpen}>
              <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
                {FIELDS_OF_STUDY.map(field => (
                  <CheckItem key={field} label={field} checked={selectedFields.includes(field)} onChange={() => toggleField(field)}/>
                ))}
              </div>
            </FilterSection>

            {/* ── Intakes ── */}
            <FilterSection title="Intakes" icon={Calendar}>
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {intakeOptions.map(intake => (
                  <CheckItem key={intake} label={intake} checked={selectedIntakes.includes(intake)} onChange={() => toggleIntake(intake)}/>
                ))}
              </div>
            </FilterSection>

            {/* ── Program Tags ── */}
            <FilterSection title="Program Tag" icon={Tag}>
              <div className="space-y-0.5">
                {PROGRAM_TAGS.map(tag => (
                  <CheckItem key={tag} label={tag} checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)}/>
                ))}
              </div>
            </FilterSection>

            {/* ── Destination ── */}
            <FilterSection title="Destination" icon={Globe} defaultOpen={false}>
              {['Canada','United Kingdom','Australia','USA','Germany','Ireland','New Zealand','France'].map(c => (
                <CheckItem key={c} label={c}
                  checked={selectedCountry === c}
                  onChange={() => { setSelectedCountry(selectedCountry===c?'':c); setPage(1); }}/>
              ))}
            </FilterSection>

            {/* ── Instant ── */}
            <FilterSection title="Submission Type" icon={Zap} defaultOpen={false}>
              <CheckItem label="Instant Submission" checked={instantFilter==='submission'} onChange={() => { setInstantFilter(instantFilter==='submission'?'':'submission'); setPage(1); }}/>
              <CheckItem label="Instant Offer" checked={instantFilter==='offer'} onChange={() => { setInstantFilter(instantFilter==='offer'?'':'offer'); setPage(1); }}/>
            </FilterSection>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="bg-white border-b border-slate-200 px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              <button onClick={() => setSidebarOpen(o => !o)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all shrink-0
                  ${sidebarOpen ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <SlidersHorizontal className="w-4 h-4"/>
                {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
                {activeFilters.length > 0 && !sidebarOpen && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">{activeFilters.length}</span>
                )}
              </button>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input value={search} onChange={e => { handleSearch(e.target.value); }}
                  placeholder="What would you like to study? (e.g., computer science, MBA)"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"/>
              </div>

              {/* Results count */}
              <div className="text-sm text-slate-500 font-semibold shrink-0">
                {loading ? '…' : <><span className="text-slate-800 font-bold">{total.toLocaleString()}</span> programs</>}
              </div>
            </div>

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeFilters.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold px-3 py-1 rounded-full">
                    {f.label}
                    <button onClick={() => removeFilter(f)} className="hover:text-brand-900 transition-colors"><X className="w-3 h-3"/></button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-500 font-semibold px-2 py-1 rounded-full border border-slate-200 hover:border-red-200 transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Program grid */}
          <div className="flex-1 p-5 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg"/></div>
            ) : programs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300"/>
                </div>
                <h3 className="font-bold text-slate-700 mb-1 text-lg">No programs found</h3>
                <p className="text-slate-400 text-sm mb-4">Try adjusting your search or filters</p>
                <button onClick={clearAll} className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 px-4 py-2 rounded-xl transition-colors">
                  <RotateCcw className="w-4 h-4"/>Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${sidebarOpen ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                  {programs.map(p => (
                    <ProgramCard key={p.id} prog={p} onApply={setApplyProg}/>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4"/>Prev
                    </button>
                    <div className="flex gap-1">
                      {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        let p;
                        if (totalPages <= 5) p = i+1;
                        else if (page <= 3) p = i+1;
                        else if (page >= totalPages-2) p = totalPages-4+i;
                        else p = page-2+i;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors
                              ${page===p ? 'bg-brand-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'}`}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Next<ChevronRight className="w-4 h-4"/>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Application Wizard */}
      {applyProg && (
        <ApplicationWizard program={applyProg} onClose={() => setApplyProg(null)}
          onSuccess={() => { setApplyProg(null); router.push('/agent/applications'); }}/>
      )}
    </AdminLayout>
  );
}