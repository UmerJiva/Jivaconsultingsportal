// pages/admin/hotels/new.js AND pages/admin/hotels/[id]/edit.js
// Both import and render this same component
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  Save, ArrowLeft, Plus, Trash2, X, Loader2, AlertCircle,
  CheckCircle, Hotel, MapPin, Image as ImageIcon, Star,
  ChevronDown, ChevronUp, Pencil
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
          {Icon && <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-emerald-600" /></div>}
          <span className="font-bold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  );
}

const AMENITY_OPTIONS = [
  'Free Wifi', 'Free parking', 'Swimming pool', 'Spa', 'Restaurant',
  '24-hour front desk', 'Airport shuttle', 'Air conditioning',
  'Daily housekeeping', 'Laundry', 'Terrace', 'Heating',
  'Fitness center', 'Bar', 'Room service', 'Pet friendly',
  'Kitchen', 'Private bathroom', 'Flat-screen TV', 'View',
  'Apartments', 'Shower', 'Valet parking', 'Elevator',
];

// ── Room Form Modal ───────────────────────────────────────────
function RoomModal({ room, onSave, onClose }) {
  const empty = {
    name: '', description: '', size_sqm: '', max_guests: 2, bed_type: '',
    view_type: '', price_per_night: '', original_price: '', discount_percent: 0,
    free_cancellation: true, cancellation_deadline: '', no_prepayment: true,
    status: 'available', is_recommended: false, amenities: [], inclusions: [], image_url: '',
  };
  const [form, setForm] = useState(room
    ? { ...empty, ...room, amenities: room.amenities || [], inclusions: room.inclusions || [] }
    : empty);
  const [amenityInput, setAmenityInput] = useState('');
  const [inclInput, setInclInput]       = useState('');

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function addAmenity() { if (!amenityInput.trim()) return; f('amenities', [...form.amenities, amenityInput.trim()]); setAmenityInput(''); }
  function addIncl()    { if (!inclInput.trim()) return; f('inclusions', [...form.inclusions, inclInput.trim()]); setInclInput(''); }

  const ROOM_AMENITIES = ['Free Wifi','Air conditioning','Private bathroom','Flat-screen TV','Free toiletries','Shower','Toilet','Refrigerator','Electric kettle','Heating','Hairdryer','Iron','Soundproof','City view','Landmark view','Sitting area','Dining area','Kitchen'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-3xl">
          <h3 className="font-bold text-slate-800 text-lg">{room ? 'Edit Room Type' : 'Add Room Type'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FL label="Room Name" required>
                <input className={inp2} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Quadruple Room, Superior King Suite" />
              </FL>
            </div>
            <FL label="Price per Night (PKR)" required>
              <input type="number" className={inp2} value={form.price_per_night} onChange={e => f('price_per_night', e.target.value)} placeholder="13300" />
            </FL>
            <FL label="Original Price (if discounted)">
              <input type="number" className={inp2} value={form.original_price || ''} onChange={e => f('original_price', e.target.value)} placeholder="Leave empty if no discount" />
            </FL>
            <FL label="Discount %">
              <input type="number" min="0" max="100" className={inp2} value={form.discount_percent} onChange={e => f('discount_percent', parseInt(e.target.value) || 0)} />
            </FL>
            <FL label="Max Guests">
              <input type="number" min="1" max="20" className={inp2} value={form.max_guests} onChange={e => f('max_guests', parseInt(e.target.value))} />
            </FL>
            <FL label="Bed Type">
              <input className={inp2} value={form.bed_type} onChange={e => f('bed_type', e.target.value)} placeholder="e.g. 2 king beds" />
            </FL>
            <FL label="Room Size (m²)">
              <input type="number" className={inp2} value={form.size_sqm || ''} onChange={e => f('size_sqm', e.target.value)} placeholder="23" />
            </FL>
            <FL label="View Type">
              <input className={inp2} value={form.view_type || ''} onChange={e => f('view_type', e.target.value)} placeholder="City view, Landmark view" />
            </FL>
            <div className="col-span-2">
              <FL label="Free Cancellation Deadline">
                <input type="date" className={inp2} value={form.cancellation_deadline || ''} onChange={e => f('cancellation_deadline', e.target.value)} />
              </FL>
            </div>
            <FL label="Room Image URL">
              <input className={inp2} value={form.image_url || ''} onChange={e => f('image_url', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </FL>
            <FL label="Status">
              <select className={inp2} value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </FL>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-5">
            {[
              { key: 'free_cancellation', label: 'Free Cancellation' },
              { key: 'no_prepayment',     label: 'No Prepayment Needed' },
              { key: 'is_recommended',    label: 'Mark as Recommended' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={!!form[key]} onChange={e => f(key, e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </label>
            ))}
          </div>

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
                placeholder="Custom amenity..."
                onKeyDown={e => e.key === 'Enter' && addAmenity()} />
              <button type="button" onClick={addAmenity} className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
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
                placeholder="e.g. Includes 1 parking spot + early check-in"
                onKeyDown={e => e.key === 'Enter' && addIncl()} />
              <button type="button" onClick={addIncl} className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-3xl sticky bottom-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-white transition-colors">Cancel</button>
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
export default function HotelFormPage() {
  const router  = useRouter();
  const { id }  = router.query;
  const isNew   = !id || id === 'new';

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error,   setError]   = useState('');
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    name: '', slug: '', star_rating: 3, description: '',
    address: '', city: '', country: '', latitude: '', longitude: '',
    phone: '', email: '', website: '',
    check_in_time: '14:00', check_out_time: '11:00',
    status: 'active', is_featured: false,
    review_score: 0, review_count: 0, review_label: '',
    currency: 'PKR', free_cancellation: true, no_prepayment: true,
  });
  const [images,     setImages]     = useState([]);
  const [amenities,  setAmenities]  = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [highlights, setHighlights] = useState([]);

  const [newImgUrl,     setNewImgUrl]     = useState('');
  const [newImgCaption, setNewImgCaption] = useState('');
  const [roomModal,     setRoomModal]     = useState(null); // null | 'new' | {room, idx}

  useEffect(() => {
    if (!isNew && id) loadHotel();
  }, [id, isNew]);

  async function loadHotel() {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/hotels/${id}`).then(r => r.json());
      setForm({
        name: data.name || '', slug: data.slug || '',
        star_rating: data.star_rating || 3, description: data.description || '',
        address: data.address || '', city: data.city || '', country: data.country || '',
        latitude: data.latitude || '', longitude: data.longitude || '',
        phone: data.phone || '', email: data.email || '', website: data.website || '',
        check_in_time: data.check_in_time || '14:00',
        check_out_time: data.check_out_time || '11:00',
        status: data.status || 'active', is_featured: !!data.is_featured,
        review_score: data.review_score || 0, review_count: data.review_count || 0,
        review_label: data.review_label || '',
        currency: data.currency || 'PKR',
        free_cancellation: !!data.free_cancellation, no_prepayment: !!data.no_prepayment,
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

  function addImage() {
    if (!newImgUrl.trim()) return;
    setImages(p => [...p, { image_url: newImgUrl.trim(), caption: newImgCaption.trim(), is_primary: p.length === 0 ? 1 : 0, sort_order: p.length }]);
    setNewImgUrl(''); setNewImgCaption('');
  }

  function setPrimary(i) { setImages(p => p.map((img, idx) => ({ ...img, is_primary: idx === i ? 1 : 0 }))); }

  async function handleSave() {
    if (!form.name || !form.city || !form.country) {
      setError('Hotel name, city and country are required.'); return;
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
      else loadHotel();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <AdminLayout title={isNew ? 'Add Hotel' : 'Edit Hotel'}>
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </AdminLayout>
  );

  const pageTitle = isNew ? 'Add Hotel' : `Edit: ${form.name || 'Hotel'}`;

  return (
    <AdminLayout title={pageTitle}>

      {/* ── Top bar ── */}
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
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Hotel'}
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
          <CheckCircle className="w-4 h-4 shrink-0" />Hotel saved successfully!
        </div>
      )}

      {/* ── BASIC INFO ── */}
      <Section title="Basic Information" icon={Hotel}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2">
            <FL label="Hotel Name" required>
              <input className={inp} value={form.name}
                onChange={e => { f('name', e.target.value); if (isNew) f('slug', autoSlug(e.target.value)); }}
                placeholder="e.g. Taksim Golden Stay Hotel" />
            </FL>
          </div>
          <FL label="URL Slug" hint="Auto-generated. Used in: /hotels/your-slug">
            <input className={inp} value={form.slug} onChange={e => f('slug', e.target.value)} placeholder="taksim-golden-stay-hotel" />
          </FL>
          <FL label="Star Rating">
            <div className="flex items-center gap-2 h-[42px]">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => f('star_rating', n)}
                  className="transition-transform hover:scale-110">
                  <Star className={`w-7 h-7 transition-colors ${n <= form.star_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                </button>
              ))}
              <span className="text-sm text-slate-500 ml-1">{form.star_rating} Star{form.star_rating > 1 ? 's' : ''}</span>
            </div>
          </FL>
          <div className="col-span-2">
            <FL label="Description" hint="Use double line breaks (Enter twice) to create paragraphs.">
              <textarea className={inp + ' resize-none'} rows={6} value={form.description}
                onChange={e => f('description', e.target.value)}
                placeholder="Prime City Center Location: Describe the hotel's location...&#10;&#10;Comfortable Accommodations: Describe the rooms...&#10;&#10;Convenient Services: List available services..." />
            </FL>
          </div>
        </div>
      </Section>

      {/* ── LOCATION ── */}
      <Section title="Location" icon={MapPin}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2">
            <FL label="Street Address">
              <input className={inp} value={form.address} onChange={e => f('address', e.target.value)} placeholder="e.g. Doğramacı Şakir Sokak 25/A, 34435" />
            </FL>
          </div>
          <FL label="City" required>
            <input className={inp} value={form.city} onChange={e => f('city', e.target.value)} placeholder="Istanbul" />
          </FL>
          <FL label="Country" required>
            <input className={inp} value={form.country} onChange={e => f('country', e.target.value)} placeholder="Turkey" />
          </FL>
          <FL label="Latitude" hint="For Google Maps display">
            <input type="number" step="any" className={inp} value={form.latitude} onChange={e => f('latitude', e.target.value)} placeholder="41.0370" />
          </FL>
          <FL label="Longitude">
            <input type="number" step="any" className={inp} value={form.longitude} onChange={e => f('longitude', e.target.value)} placeholder="28.9770" />
          </FL>
        </div>
      </Section>

      {/* ── CONTACT & POLICY ── */}
      <Section title="Contact & Booking Policy" icon={CheckCircle}>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <FL label="Phone"><input className={inp} value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+90 212 000 0000" /></FL>
          <FL label="Email"><input type="email" className={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="info@hotel.com" /></FL>
          <FL label="Website"><input className={inp} value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://hotel.com" /></FL>
          <FL label="Currency">
            <select className={sel} value={form.currency} onChange={e => f('currency', e.target.value)}>
              {['PKR', 'USD', 'EUR', 'GBP', 'TRY', 'AED', 'SAR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </FL>
          <FL label="Check-in Time"><input type="time" className={inp} value={form.check_in_time} onChange={e => f('check_in_time', e.target.value)} /></FL>
          <FL label="Check-out Time"><input type="time" className={inp} value={form.check_out_time} onChange={e => f('check_out_time', e.target.value)} /></FL>
        </div>
        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-slate-100">
          {[
            { key: 'free_cancellation', label: 'Free Cancellation on most rooms' },
            { key: 'no_prepayment',     label: 'No prepayment needed' },
            { key: 'is_featured',       label: 'Featured property (shown first)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={!!form[key]} onChange={e => f(key, e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
              <span className="text-sm font-semibold text-slate-700">{label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <FL label="Review Score (0–10)">
            <input type="number" step="0.1" min="0" max="10" className={inp} value={form.review_score} onChange={e => f('review_score', parseFloat(e.target.value) || 0)} placeholder="7.2" />
          </FL>
          <FL label="Review Count">
            <input type="number" min="0" className={inp} value={form.review_count} onChange={e => f('review_count', parseInt(e.target.value) || 0)} placeholder="22" />
          </FL>
          <FL label="Review Label">
            <select className={sel} value={form.review_label} onChange={e => f('review_label', e.target.value)}>
              <option value="">Select label</option>
              {['Acceptable', 'Good', 'Very Good', 'Wonderful', 'Exceptional'].map(l => <option key={l}>{l}</option>)}
            </select>
          </FL>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <FL label="Status">
            <div className="flex gap-3">
              {['active', 'inactive', 'draft'].map(s => (
                <button key={s} type="button" onClick={() => f('status', s)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                    form.status === s
                      ? s === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : s === 'draft' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-600 text-white border-slate-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>{s}</button>
              ))}
            </div>
          </FL>
        </div>
      </Section>

      {/* ── IMAGES ── */}
      <Section title="Hotel Images" icon={ImageIcon}>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4 mt-2">
            {images.map((img, i) => (
              <div key={i} className={`relative rounded-2xl overflow-hidden group border-2 transition-all ${img.is_primary ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200'}`}>
                <img src={img.image_url} alt={img.caption} className="w-full h-32 object-cover" onError={e => e.target.src = 'https://via.placeholder.com/300x128?text=Image'} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button type="button" onClick={() => setPrimary(i)} className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg">Set Primary</button>
                  )}
                  <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} className="p-1.5 bg-red-500 text-white rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {img.is_primary && (
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">PRIMARY</div>
                )}
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">{img.caption}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <input className={inp + ' flex-1'} value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)}
            placeholder="Paste image URL (Unsplash, your CDN, etc.)" />
          <input className={inp + ' w-44'} value={newImgCaption} onChange={e => setNewImgCaption(e.target.value)} placeholder="Caption (optional)" />
          <button type="button" onClick={addImage}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Tip: Use Unsplash.com — paste the image URL ending with ?w=800 for good quality. First image is set as primary automatically.</p>
      </Section>

      {/* ── AMENITIES ── */}
      <Section title="Facilities & Amenities" defaultOpen={true}>
        <div className="flex flex-wrap gap-2 mt-2">
          {AMENITY_OPTIONS.map(name => (
            <button key={name} type="button" onClick={() => setAmenities(p => p.includes(name) ? p.filter(a => a !== name) : [...p, name])}
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
          <input id="customAm" className={inp + ' flex-1'} placeholder="Custom facility (e.g. Rooftop bar, Infinity pool)..." />
          <button type="button"
            onClick={() => {
              const v = document.getElementById('customAm').value.trim();
              if (v && !amenities.includes(v)) { setAmenities(p => [...p, v]); document.getElementById('customAm').value = ''; }
            }}
            className="bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors">Add</button>
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

      {/* ── ROOM TYPES ── */}
      <Section title="Room Types">
        <div className="space-y-3 mb-4 mt-2">
          {rooms.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <Hotel className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No room types yet</p>
              <p className="text-xs">Add at least one room type for availability</p>
            </div>
          )}
          {rooms.map((room, i) => {
            const totalPKR = Number(room.price_per_night).toLocaleString();
            return (
              <div key={i} className="border border-slate-200 rounded-2xl p-4 flex items-start justify-between hover:border-emerald-200 transition-colors bg-slate-50/50">
                <div className="flex gap-3">
                  {room.image_url && (
                    <img src={room.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200" alt="" onError={e => e.target.style.display='none'} />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{room.name}</span>
                      {room.is_recommended && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">Recommended</span>}
                      {room.status === 'unavailable' && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Unavailable</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                      {room.bed_type && <span>🛏️ {room.bed_type}</span>}
                      {room.size_sqm && <span>📐 {room.size_sqm}m²</span>}
                      <span>👥 Max {room.max_guests}</span>
                      {room.view_type && <span>🏙️ {room.view_type}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-emerald-700 text-sm">PKR {totalPKR}/night</span>
                      {room.original_price && (
                        <span className="text-xs text-slate-400 line-through">PKR {Number(room.original_price).toLocaleString()}</span>
                      )}
                      {room.discount_percent > 0 && (
                        <span className="text-[10px] bg-green-600 text-white font-bold px-1.5 py-0.5 rounded">{room.discount_percent}% off</span>
                      )}
                    </div>
                    {room.amenities?.length > 0 && (
                      <div className="text-xs text-slate-400 mt-0.5">{room.amenities.slice(0, 4).join(' · ')}{room.amenities.length > 4 ? ` +${room.amenities.length - 4} more` : ''}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" onClick={() => setRoomModal({ room, idx: i })}
                    className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit room">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setRooms(p => p.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Remove room">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => setRoomModal('new')}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      </Section>

      {/* ── HIGHLIGHTS ── */}
      <Section title="Property Highlights" defaultOpen={false}>
        <div className="space-y-2 mb-3 mt-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input className={inp} value={h.title} onChange={e => setHighlights(p => p.map((hi, idx) => idx === i ? { ...hi, title: e.target.value } : hi))} placeholder="e.g. Top Location, Perfect for families" />
                <input className={inp} value={h.description || ''} onChange={e => setHighlights(p => p.map((hi, idx) => idx === i ? { ...hi, description: e.target.value } : hi))} placeholder="Description (optional)" />
              </div>
              <button type="button" onClick={() => setHighlights(p => p.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setHighlights(p => [...p, { title: '', description: '', icon: 'map-pin', sort_order: p.length }])}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Highlight
        </button>
        <p className="text-xs text-slate-400 mt-2">Highlights appear in the right sidebar of the hotel detail page (e.g. "Perfect for a 4-week stay!", "FREE parking!")</p>
      </Section>

      {/* Bottom save bar */}
      <div className="flex items-center justify-between py-4 mt-2 border-t border-slate-200 bg-slate-50 rounded-2xl px-5">
        <button type="button" onClick={() => router.push('/admin/hotels')} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-white transition-colors">
          ← Back to Hotels
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 shadow-sm shadow-emerald-200 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : isNew ? 'Create Hotel' : 'Save Changes'}
        </button>
      </div>

      {/* Room Modal */}
      {roomModal !== null && (
        <RoomModal
          room={roomModal === 'new' ? null : roomModal.room}
          onSave={roomData => {
            if (roomModal === 'new') {
              setRooms(p => [...p, roomData]);
            } else {
              setRooms(p => p.map((r, i) => i === roomModal.idx ? roomData : r));
            }
            setRoomModal(null);
          }}
          onClose={() => setRoomModal(null)}
        />
      )}
    </AdminLayout>
  );
}