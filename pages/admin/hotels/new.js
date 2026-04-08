// pages/admin/hotels/form.js — Student Dormitory form
// Used by both new.js and [id]/edit.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Save, ArrowLeft, Plus, Trash2, X, Loader2, AlertCircle,
  CheckCircle, Home, MapPin, Upload, ChevronDown, ChevronUp, Pencil
} from 'lucide-react';

const inp  = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder-slate-300 transition-colors";
const sel  = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 transition-colors";
const inp2 = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder-slate-300";

function FL({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
          )}
          <span className="font-bold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  );
}

const AMENITY_OPTIONS = [
  'Free Wifi', 'Study Room', 'Common Kitchen', 'Laundry', 'Air conditioning',
  'Heating', 'Elevator', 'Security / CCTV', '24-hour Reception', 'Parking',
  'Gym / Fitness', 'Common Room / Lounge', 'Garden / Terrace', 'Bicycle Storage',
  'On-site Cafe', 'Prayer Room', 'Female-only Floor', 'Male-only Floor',
  'Disabled Access', 'Bills Included',
];

// ── Photo upload helper ───────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.readAsDataURL(file);
  });
}

// ── Room / Dormitory Modal ────────────────────────────────────
function RoomModal({ room, onSave, onClose }) {
  const empty = {
    name: '', description: '', size_sqm: '', max_guests: 1, bed_type: '',
    price_per_night: '', actual_price: '',
    status: 'available', is_recommended: false,
    amenities: [], inclusions: [], image_url: '',
  };
  const [form, setForm] = useState(room
    ? { ...empty, ...room, amenities: room.amenities || [], inclusions: room.inclusions || [] }
    : empty);
  const [amenityInput, setAmenityInput] = useState('');
  const [inclInput,    setInclInput]    = useState('');
  const imgRef = useRef();

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function addAmenity() {
    if (!amenityInput.trim()) return;
    f('amenities', [...form.amenities, amenityInput.trim()]);
    setAmenityInput('');
  }
  function addIncl() {
    if (!inclInput.trim()) return;
    f('inclusions', [...form.inclusions, inclInput.trim()]);
    setInclInput('');
  }

  async function handleRoomPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    f('image_url', b64);
    e.target.value = '';
  }

  const ROOM_AMENITIES = [
    'Private bathroom', 'Shared bathroom', 'Free Wifi', 'Air conditioning',
    'Heating', 'Desk & Chair', 'Wardrobe', 'Bed Linen Included',
    'Window', 'Balcony', 'Refrigerator', 'TV', 'Soundproof',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-3xl">
          <h3 className="font-bold text-slate-800 text-lg">{room ? 'Edit Room / Dormitory' : 'Add Room / Dormitory'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Room Photo Upload */}
          <FL label="Room Photo">
            {form.image_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36">
                <img src={form.image_url} className="w-full h-full object-cover" alt="room" />
                <button type="button" onClick={() => f('image_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer">
                <Upload className="w-6 h-6" />
                <span className="text-xs font-semibold">Upload Room Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleRoomPhoto} />
              </label>
            )}
          </FL>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FL label="Room / Dormitory Name" required>
                <input className={inp2} value={form.name} onChange={e => f('name', e.target.value)}
                  placeholder="e.g. Single En-Suite, 4-Bed Shared Dormitory" />
              </FL>
            </div>
            <FL label="Price per Month (PKR)" required>
              <input type="number" className={inp2} value={form.price_per_night}
                onChange={e => f('price_per_night', e.target.value)} placeholder="25000" />
            </FL>
            <FL label="Actual Price (PKR)" hint="Original price before discount">
              <input type="number" className={inp2} value={form.actual_price || ''}
                onChange={e => f('actual_price', e.target.value)} placeholder="Leave empty if no discount" />
            </FL>
            <FL label="Max Occupants">
              <input type="number" min="1" max="20" className={inp2} value={form.max_guests}
                onChange={e => f('max_guests', parseInt(e.target.value))} />
            </FL>
            <FL label="Bed Type">
              <input className={inp2} value={form.bed_type} onChange={e => f('bed_type', e.target.value)}
                placeholder="e.g. Single bed, Bunk bed" />
            </FL>
            <FL label="Room Size (m²)">
              <input type="number" className={inp2} value={form.size_sqm || ''}
                onChange={e => f('size_sqm', e.target.value)} placeholder="12" />
            </FL>
            <FL label="Status">
              <select className={inp2} value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </FL>
          </div>

          {/* Recommended */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={!!form.is_recommended} onChange={e => f('is_recommended', e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded" />
            <span className="text-sm font-semibold text-slate-700">Mark as Recommended</span>
          </label>

          {/* Room amenities quick-pick */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Room Amenities</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ROOM_AMENITIES.map(name => (
                <button key={name} type="button"
                  onClick={() => form.amenities.includes(name)
                    ? f('amenities', form.amenities.filter(a => a !== name))
                    : f('amenities', [...form.amenities, name])}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.amenities.includes(name)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400 bg-white'
                  }`}>
                  {name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={inp2 + ' flex-1'} value={amenityInput} onChange={e => setAmenityInput(e.target.value)}
                placeholder="Custom amenity..." onKeyDown={e => e.key === 'Enter' && addAmenity()} />
              <button type="button" onClick={addAmenity}
                className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">What's Included</label>
            <div className="space-y-1.5 mb-2">
              {form.inclusions.map((inc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="flex-1 text-slate-700">{inc}</span>
                  <button type="button" onClick={() => f('inclusions', form.inclusions.filter((_, idx) => idx !== i))}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={inp2 + ' flex-1'} value={inclInput} onChange={e => setInclInput(e.target.value)}
                placeholder="e.g. Bills included, Weekly cleaning..."
                onKeyDown={e => e.key === 'Enter' && addIncl()} />
              <button type="button" onClick={addIncl}
                className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-3xl sticky bottom-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-white transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(form)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            {room ? 'Save Changes' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────
export default function DormitoryFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew  = !id || id === 'new';

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error,   setError]   = useState('');
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    name: '', slug: '', description: '',
    address: '', city: '', country: '',
    phone: '', email: '', website: '',
    status: 'active', is_featured: false,
    currency: 'PKR',
  });

  const [images,     setImages]    = useState([]);
  const [amenities,  setAmenities] = useState([]);
  const [rooms,      setRooms]     = useState([]);
  const [highlights, setHighlights]= useState([]);
  const [roomModal,  setRoomModal] = useState(null);

  useEffect(() => { if (!isNew && id) loadDorm(); }, [id, isNew]);

  async function loadDorm() {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/hotels/${id}`).then(r => r.json());
      setForm({
        name:        data.name        || '',
        slug:        data.slug        || '',
        description: data.description || '',
        address:     data.address     || '',
        city:        data.city        || '',
        country:     data.country     || '',
        phone:       data.phone       || '',
        email:       data.email       || '',
        website:     data.website     || '',
        status:      data.status      || 'active',
        is_featured: !!data.is_featured,
        currency:    data.currency    || 'PKR',
      });
      setImages(data.images || []);
      setAmenities((data.amenities || []).map(a => a.name));
      setRooms(data.rooms || []);
      setHighlights(data.highlights || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handlePhotoUpload(files) {
    for (const file of files) {
      const b64 = await readFileAsBase64(file);
      setImages(p => [...p, {
        image_url:  b64,
        caption:    '',
        is_primary: p.length === 0 ? 1 : 0,
        sort_order: p.length,
      }]);
    }
  }

  function setPrimary(i) {
    setImages(p => p.map((img, idx) => ({ ...img, is_primary: idx === i ? 1 : 0 })));
  }

  async function handleSave() {
    if (!form.name || !form.city || !form.country) {
      setError('Dormitory name, city and country are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const slug    = form.slug || autoSlug(form.name);
      const payload = { ...form, slug, images, amenities, rooms, highlights };
      const method  = isNew ? 'POST' : 'PUT';
      const url     = isNew ? '/api/admin/hotels' : `/api/admin/hotels/${id}`;
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (isNew) router.replace(`/admin/hotels/${d.id}/edit`);
      else loadDorm();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <AdminLayout title={isNew ? 'Add Dormitory' : 'Edit Dormitory'}>
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </AdminLayout>
  );

  const pageTitle = isNew ? 'Add Dormitory' : `Edit: ${form.name || 'Dormitory'}`;

  return (
    <AdminLayout title={pageTitle}>

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push('/admin/hotels')}
          className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>{pageTitle}</h2>
          {!isNew && <p className="text-xs text-slate-400 mt-0.5">/{form.slug}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          {!isNew && (
            <button onClick={() => window.open(`/hotels/${form.slug}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              View Live
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 shadow-sm shadow-emerald-200 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Dormitory'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4">
          <CheckCircle className="w-4 h-4 shrink-0" />Dormitory saved successfully!
        </div>
      )}

      {/* ── BASIC INFO ── */}
      <Section title="Basic Information" icon={Home}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2">
            <FL label="Dormitory Name" required>
              <input className={inp} value={form.name}
                onChange={e => { f('name', e.target.value); if (isNew) f('slug', autoSlug(e.target.value)); }}
                placeholder="e.g. Jiva Student Residence Karachi" />
            </FL>
          </div>
          <FL label="URL Slug" hint="Auto-generated from name">
            <input className={inp} value={form.slug} onChange={e => f('slug', e.target.value)}
              placeholder="jiva-student-residence-karachi" />
          </FL>
          <FL label="Currency">
            <select className={sel} value={form.currency} onChange={e => f('currency', e.target.value)}>
              {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </FL>
          <div className="col-span-2">
            <FL label="Description">
              <textarea className={inp + ' resize-none'} rows={5} value={form.description}
                onChange={e => f('description', e.target.value)}
                placeholder="Describe the dormitory, facilities, atmosphere, nearby universities..." />
            </FL>
          </div>
        </div>
      </Section>

      {/* ── LOCATION ── */}
      <Section title="Location" icon={MapPin}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2">
            <FL label="Street Address">
              <input className={inp} value={form.address} onChange={e => f('address', e.target.value)}
                placeholder="e.g. Plot 45, Block 7, PECHS" />
            </FL>
          </div>
          <FL label="City" required>
            <input className={inp} value={form.city} onChange={e => f('city', e.target.value)} placeholder="Karachi" />
          </FL>
          <FL label="Country" required>
            <input className={inp} value={form.country} onChange={e => f('country', e.target.value)} placeholder="Pakistan" />
          </FL>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section title="Contact Details" icon={Home}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <FL label="Phone">
            <input className={inp} value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+92 21 000 0000" />
          </FL>
          <FL label="Email">
            <input type="email" className={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="info@dormitory.com" />
          </FL>
          <FL label="Website">
            <input className={inp} value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://dormitory.com" />
          </FL>
          <FL label="Status">
            <div className="flex gap-3 pt-1">
              {['active', 'inactive', 'draft'].map(s => (
                <button key={s} type="button" onClick={() => f('status', s)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                    form.status === s
                      ? s === 'active' ? 'bg-emerald-600 text-white border-emerald-600'
                        : s === 'draft' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-600 text-white border-slate-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>{s}</button>
              ))}
            </div>
          </FL>
          <div className="col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={!!form.is_featured} onChange={e => f('is_featured', e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded" />
              <span className="text-sm font-semibold text-slate-700">Featured dormitory (shown first in listings)</span>
            </label>
          </div>
        </div>
      </Section>

      {/* ── PHOTOS ── */}
      <Section title="Photos" icon={Upload}>
        <div className="mt-2">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i}
                  className={`relative rounded-2xl overflow-hidden group border-2 transition-all ${img.is_primary ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200'}`}>
                  <img src={img.image_url} alt="" className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button type="button" onClick={() => setPrimary(i)}
                        className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg">
                        Set Primary
                      </button>
                    )}
                    <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                      className="p-1.5 bg-red-500 text-white rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {img.is_primary && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">PRIMARY</div>
                  )}
                </div>
              ))}
              {/* Add more slot */}
              <label className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                <span className="text-xs font-semibold">Add More</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { handlePhotoUpload(Array.from(e.target.files || [])); e.target.value = ''; }} />
              </label>
            </div>
          ) : (
            <label className="w-full h-44 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer">
              <Upload className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-bold">Upload Photos</p>
                <p className="text-xs mt-0.5">Click to select — you can upload multiple at once</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => { handlePhotoUpload(Array.from(e.target.files || [])); e.target.value = ''; }} />
            </label>
          )}
          <p className="text-xs text-slate-400 mt-2">First photo is set as primary automatically. Hover any photo to set it as primary or remove it.</p>
        </div>
      </Section>

      {/* ── AMENITIES ── */}
      <Section title="Facilities & Amenities" icon={Home}>
        <div className="flex flex-wrap gap-2 mt-2">
          {AMENITY_OPTIONS.map(name => (
            <button key={name} type="button"
              onClick={() => setAmenities(p => p.includes(name) ? p.filter(a => a !== name) : [...p, name])}
              className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
                amenities.includes(name)
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-400 bg-white'
              }`}>
              {name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input id="customAm" className={inp + ' flex-1'} placeholder="Custom facility..." />
          <button type="button"
            onClick={() => {
              const v = document.getElementById('customAm').value.trim();
              if (v && !amenities.includes(v)) { setAmenities(p => [...p, v]); document.getElementById('customAm').value = ''; }
            }}
            className="bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors">
            Add
          </button>
        </div>
        {amenities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2 font-semibold">Selected ({amenities.length}):</p>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map(a => (
                <span key={a} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {a}
                  <button type="button" onClick={() => setAmenities(p => p.filter(x => x !== a))} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── ROOMS / DORMITORIES ── */}
      <Section title="Rooms & Dormitories" icon={Home}>
        <div className="space-y-3 mb-4 mt-2">
          {rooms.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No rooms added yet</p>
              <p className="text-xs">Add single rooms, shared rooms or dormitory types</p>
            </div>
          )}
          {rooms.map((room, i) => (
            <div key={i}
              className="border border-slate-200 rounded-2xl p-4 flex items-start justify-between hover:border-emerald-200 transition-colors bg-slate-50/50">
              <div className="flex gap-3">
                {room.image_url && (
                  <img src={room.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200" alt=""
                    onError={e => e.target.style.display = 'none'} />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{room.name}</span>
                    {room.is_recommended && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">Recommended</span>
                    )}
                    {room.status === 'unavailable' && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Unavailable</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    {room.bed_type  && <span>🛏️ {room.bed_type}</span>}
                    {room.size_sqm  && <span>📐 {room.size_sqm}m²</span>}
                    <span>👥 Max {room.max_guests}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-emerald-700 text-sm">
                      PKR {Number(room.price_per_night || 0).toLocaleString()}/month
                    </span>
                    {room.actual_price && (
                      <span className="text-xs text-slate-400 line-through">
                        PKR {Number(room.actual_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {room.amenities?.length > 0 && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {room.amenities.slice(0, 4).join(' · ')}{room.amenities.length > 4 ? ` +${room.amenities.length - 4} more` : ''}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" onClick={() => setRoomModal({ room, idx: i })}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setRooms(p => p.filter((_, idx) => idx !== i))}
                  className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRoomModal('new')}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Room / Dormitory
        </button>
      </Section>

      {/* ── HIGHLIGHTS ── */}
      <Section title="Highlights" defaultOpen={false}>
        <div className="space-y-2 mb-3 mt-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input className={inp} value={h.title}
                  onChange={e => setHighlights(p => p.map((hi, idx) => idx === i ? { ...hi, title: e.target.value } : hi))}
                  placeholder="e.g. Close to campus, Study-friendly" />
                <input className={inp} value={h.description || ''}
                  onChange={e => setHighlights(p => p.map((hi, idx) => idx === i ? { ...hi, description: e.target.value } : hi))}
                  placeholder="Description (optional)" />
              </div>
              <button type="button" onClick={() => setHighlights(p => p.filter((_, idx) => idx !== i))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setHighlights(p => [...p, { title: '', description: '', icon: 'map-pin', sort_order: p.length }])}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Highlight
        </button>
      </Section>

      {/* Bottom save bar */}
      <div className="flex items-center justify-between py-4 mt-2 border-t border-slate-200 bg-slate-50 rounded-2xl px-5">
        <button type="button" onClick={() => router.push('/admin/hotels')}
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-white transition-colors">
          ← Back to Dormitories
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 shadow-sm shadow-emerald-200 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : isNew ? 'Create Dormitory' : 'Save Changes'}
        </button>
      </div>

      {/* Room Modal */}
      {roomModal !== null && (
        <RoomModal
          room={roomModal === 'new' ? null : roomModal.room}
          onSave={roomData => {
            if (roomModal === 'new') setRooms(p => [...p, roomData]);
            else setRooms(p => p.map((r, i) => i === roomModal.idx ? roomData : r));
            setRoomModal(null);
          }}
          onClose={() => setRoomModal(null)}
        />
      )}
    </AdminLayout>
  );
}