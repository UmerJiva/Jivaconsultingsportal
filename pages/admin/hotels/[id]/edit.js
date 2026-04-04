// pages/admin/hotels/[id]/edit.js (also used for new via pages/admin/hotels/new.js)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/layout/AdminLayout';
import {
  Save, ArrowLeft, Plus, Trash2, X, Upload, Pencil , Image,
  Loader2, AlertCircle, CheckCircle, GripVertical,
  Star, Building2, MapPin, Image as ImageIcon
} from 'lucide-react';

const inp = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder-slate-300 transition-colors";
const sel = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 transition-colors";

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

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const AMENITY_OPTIONS = [
  'Free Wifi','Free parking','Swimming pool','Spa','Restaurant',
  '24-hour front desk','Airport shuttle','Air conditioning',
  'Daily housekeeping','Laundry','Terrace','Heating',
  'Fitness center','Bar','Room service','Pet friendly',
  'Kitchen','Private bathroom','Flat-screen TV','View',
  'Apartments','Shower','Valet parking',
];

export default function HotelFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === undefined || router.pathname.includes('/new');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Hotel form
  const [form, setForm] = useState({
    name: '', slug: '', star_rating: 3, description: '',
    address: '', city: '', country: '', latitude: '', longitude: '',
    phone: '', email: '', website: '',
    check_in_time: '14:00', check_out_time: '11:00',
    status: 'active', is_featured: false,
    review_score: 0, review_count: 0, review_label: '',
    currency: 'PKR', free_cancellation: true, no_prepayment: true,
  });

  // Images
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  // Amenities
  const [amenities, setAmenities] = useState([]);

  // Rooms
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  // Highlights
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    if (!isNew && id) loadHotel();
  }, [id, isNew]);

  async function loadHotel() {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/hotels/${id}`).then(r => r.json());
      setForm({
        name: data.name || '', slug: data.slug || '',
        star_rating: data.star_rating || 3,
        description: data.description || '',
        address: data.address || '', city: data.city || '',
        country: data.country || '',
        latitude: data.latitude || '', longitude: data.longitude || '',
        phone: data.phone || '', email: data.email || '',
        website: data.website || '',
        check_in_time: data.check_in_time || '14:00',
        check_out_time: data.check_out_time || '11:00',
        status: data.status || 'active',
        is_featured: !!data.is_featured,
        review_score: data.review_score || 0,
        review_count: data.review_count || 0,
        review_label: data.review_label || '',
        currency: data.currency || 'PKR',
        free_cancellation: !!data.free_cancellation,
        no_prepayment: !!data.no_prepayment,
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
    if (!newImageUrl.trim()) return;
    setImages(p => [...p, {
      image_url: newImageUrl.trim(),
      caption: newImageCaption.trim(),
      is_primary: p.length === 0 ? 1 : 0,
      sort_order: p.length,
    }]);
    setNewImageUrl(''); setNewImageCaption('');
  }

  function removeImage(i) { setImages(p => p.filter((_, idx) => idx !== i)); }
  function setPrimary(i) { setImages(p => p.map((img, idx) => ({ ...img, is_primary: idx === i ? 1 : 0 }))); }

  function toggleAmenity(name) {
    setAmenities(p => p.includes(name) ? p.filter(a => a !== name) : [...p, name]);
  }

  async function handleSave() {
    if (!form.name || !form.city || !form.country) {
      setError('Name, city and country are required'); return;
    }
    setSaving(true); setError('');
    try {
      const slug = form.slug || autoSlug(form.name);
      const payload = { ...form, slug, images, amenities, rooms, highlights };
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/hotels' : `/api/admin/hotels/${id}`;
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
    <AdminLayout title="Hotel">
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Add Hotel' : 'Edit Hotel'}>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isNew ? 'Add New Hotel' : `Edit: ${form.name}`}</h2>
        </div>
        <div className="ml-auto flex gap-2">
          {!isNew && (
            <button onClick={() => window.open(`/hotels/${form.slug}`, '_blank')}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View Live
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Hotel'}
          </button>
        </div>
      </div>

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
      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <FL label="Hotel Name" required>
              <input className={inp} value={form.name}
                onChange={e => { f('name', e.target.value); if (isNew) f('slug', autoSlug(e.target.value)); }}
                placeholder="e.g. Taksim Golden Stay Hotel" />
            </FL>
          </div>
          <FL label="URL Slug" hint="Auto-generated from name">
            <input className={inp} value={form.slug} onChange={e => f('slug', e.target.value)} placeholder="taksim-golden-stay-hotel" />
          </FL>
          <FL label="Star Rating">
            <select className={sel} value={form.star_rating} onChange={e => f('star_rating', parseInt(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
            </select>
          </FL>
        </div>
        <FL label="Description">
          <textarea className={inp + ' resize-none'} rows={6} value={form.description}
            onChange={e => f('description', e.target.value)}
            placeholder="Describe the hotel... (Use double line breaks for paragraphs)" />
        </FL>
      </Section>

      {/* ── LOCATION ── */}
      <Section title="Location">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FL label="Street Address">
              <input className={inp} value={form.address} onChange={e => f('address', e.target.value)} placeholder="Doğramacı Şakir Sokak 25/A, 34435" />
            </FL>
          </div>
          <FL label="City" required>
            <input className={inp} value={form.city} onChange={e => f('city', e.target.value)} placeholder="Istanbul" />
          </FL>
          <FL label="Country" required>
            <input className={inp} value={form.country} onChange={e => f('country', e.target.value)} placeholder="Turkey" />
          </FL>
          <FL label="Latitude" hint="For map display">
            <input type="number" step="any" className={inp} value={form.latitude} onChange={e => f('latitude', e.target.value)} placeholder="41.0370" />
          </FL>
          <FL label="Longitude">
            <input type="number" step="any" className={inp} value={form.longitude} onChange={e => f('longitude', e.target.value)} placeholder="28.9770" />
          </FL>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section title="Contact & Policy">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FL label="Phone"><input className={inp} value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+90 212 000 0000" /></FL>
          <FL label="Email"><input type="email" className={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="info@hotel.com" /></FL>
          <FL label="Website"><input className={inp} value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://hotel.com" /></FL>
          <FL label="Currency">
            <select className={sel} value={form.currency} onChange={e => f('currency', e.target.value)}>
              {['PKR','USD','EUR','GBP','TRY','AED'].map(c => <option key={c}>{c}</option>)}
            </select>
          </FL>
          <FL label="Check-in Time"><input type="time" className={inp} value={form.check_in_time} onChange={e => f('check_in_time', e.target.value)} /></FL>
          <FL label="Check-out Time"><input type="time" className={inp} value={form.check_out_time} onChange={e => f('check_out_time', e.target.value)} /></FL>
        </div>
        <div className="flex gap-6 flex-wrap">
          {[
            { key: 'free_cancellation', label: 'Free Cancellation on most rooms' },
            { key: 'no_prepayment', label: 'No prepayment needed' },
            { key: 'is_featured', label: 'Featured property' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form[key]} onChange={e => f(key, e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* ── REVIEW STATS ── */}
      <Section title="Review Statistics">
        <div className="grid grid-cols-3 gap-4">
          <FL label="Review Score (0-10)">
            <input type="number" step="0.1" min="0" max="10" className={inp} value={form.review_score} onChange={e => f('review_score', parseFloat(e.target.value))} placeholder="7.2" />
          </FL>
          <FL label="Review Count">
            <input type="number" min="0" className={inp} value={form.review_count} onChange={e => f('review_count', parseInt(e.target.value))} placeholder="22" />
          </FL>
          <FL label="Review Label">
            <select className={sel} value={form.review_label} onChange={e => f('review_label', e.target.value)}>
              <option value="">Select label</option>
              {['Acceptable','Good','Very Good','Wonderful','Exceptional'].map(l => <option key={l}>{l}</option>)}
            </select>
          </FL>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <FL label="Status">
            <select className={sel + ' w-auto'} value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </FL>
        </div>
      </Section>

      {/* ── IMAGES ── */}
      <Section title="Hotel Images">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {images.map((img, i) => (
            <div key={i} className={`relative border-2 rounded-xl overflow-hidden group ${img.is_primary ? 'border-brand-500' : 'border-slate-200'}`}>
              <img src={img.image_url} alt={img.caption} className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button onClick={() => setPrimary(i)} className="text-xs bg-white text-slate-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-100">
                    Set Primary
                  </button>
                )}
                <button onClick={() => removeImage(i)} className="p-1.5 bg-red-500 text-white rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {img.is_primary && (
                <div className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Primary</div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                {img.caption || img.image_url.split('/').pop()}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <input className={inp} value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
              placeholder="Image URL (e.g. https://images.unsplash.com/...)" />
          </div>
          <input className={inp + ' w-48'} value={newImageCaption} onChange={e => setNewImageCaption(e.target.value)}
            placeholder="Caption (optional)" />
          <button onClick={addImage} className="bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-brand-800 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Paste direct image URLs. Use Unsplash (unsplash.com), your CDN, or uploaded image paths.</p>
      </Section>

      {/* ── AMENITIES ── */}
      <Section title="Facilities & Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(name => (
            <button key={name} onClick={() => toggleAmenity(name)}
              className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
                amenities.includes(name)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-slate-200 text-slate-600 hover:border-brand-400 bg-white'
              }`}>
              {name}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">Add custom amenity:</p>
          <div className="flex gap-2">
            <input id="customAmenity" className={inp + ' flex-1'} placeholder="e.g. Airport shuttle" />
            <button onClick={() => {
              const v = document.getElementById('customAmenity').value.trim();
              if (v) { setAmenities(p => [...p, v]); document.getElementById('customAmenity').value = ''; }
            }} className="bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-800">Add</button>
          </div>
        </div>
      </Section>

      {/* ── ROOMS ── */}
      <Section title="Room Types">
        <div className="space-y-3 mb-4">
          {rooms.map((room, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-800">{room.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{room.bed_type} · {room.max_guests} guests max · PKR {Number(room.price_per_night).toLocaleString()}/night</div>
                {room.is_recommended && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded mt-1 inline-block">Recommended</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingRoom({ ...room, _idx: i }); setShowRoomForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setRooms(p => p.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>

        {/* Room Form Modal */}
        {showRoomForm && (
          <RoomFormModal
            room={editingRoom}
            onSave={(roomData) => {
              if (editingRoom?._idx !== undefined) {
                setRooms(p => p.map((r, i) => i === editingRoom._idx ? roomData : r));
              } else {
                setRooms(p => [...p, roomData]);
              }
              setShowRoomForm(false); setEditingRoom(null);
            }}
            onClose={() => { setShowRoomForm(false); setEditingRoom(null); }}
          />
        )}
      </Section>

      {/* ── HIGHLIGHTS ── */}
      <Section title="Property Highlights">
        <div className="space-y-2 mb-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3">
              <div className="flex-1">
                <input className={inp + ' mb-1'} value={h.title} onChange={e => setHighlights(p => p.map((hi, idx) => idx===i?{...hi,title:e.target.value}:hi))} placeholder="e.g. Top Location" />
                <input className={inp} value={h.description||''} onChange={e => setHighlights(p => p.map((hi, idx) => idx===i?{...hi,description:e.target.value}:hi))} placeholder="Description (optional)" />
              </div>
              <button onClick={() => setHighlights(p => p.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setHighlights(p => [...p, { title: '', description: '', icon: 'map-pin', sort_order: p.length }])}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50">
          <Plus className="w-4 h-4" /> Add Highlight
        </button>
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 mt-2 pb-8">
        <button onClick={() => router.back()} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Hotel'}
        </button>
      </div>
    </AdminLayout>
  );
}

// ── Room Form Modal ───────────────────────────────────────────
function RoomFormModal({ room, onSave, onClose }) {
  const EMPTY = {
    name: '', description: '', size_sqm: '', max_guests: 2, bed_type: '',
    view_type: '', price_per_night: '', original_price: '',
    discount_percent: 0, free_cancellation: true,
    cancellation_deadline: '', no_prepayment: true,
    status: 'available', is_recommended: false,
    amenities: [], inclusions: [],
    image_url: '',
  };

  const [form, setForm] = useState(room ? { ...EMPTY, ...room, amenities: room.amenities||[], inclusions: room.inclusions||[] } : EMPTY);
  const [newAmenity, setNewAmenity] = useState('');
  const [newInclusion, setNewInclusion] = useState('');

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }

  const inp2 = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800">{room ? 'Edit Room Type' : 'Add Room Type'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Room Name *</label>
              <input className={inp2} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Quadruple Room" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price per Night (PKR) *</label>
              <input type="number" className={inp2} value={form.price_per_night} onChange={e => f('price_per_night', e.target.value)} placeholder="13300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Original Price (if discounted)</label>
              <input type="number" className={inp2} value={form.original_price||''} onChange={e => f('original_price', e.target.value)} placeholder="24183" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Discount %</label>
              <input type="number" min="0" max="100" className={inp2} value={form.discount_percent} onChange={e => f('discount_percent', parseInt(e.target.value)||0)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Guests</label>
              <input type="number" min="1" className={inp2} value={form.max_guests} onChange={e => f('max_guests', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bed Type</label>
              <input className={inp2} value={form.bed_type} onChange={e => f('bed_type', e.target.value)} placeholder="2 king beds" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Room Size (m²)</label>
              <input type="number" className={inp2} value={form.size_sqm||''} onChange={e => f('size_sqm', e.target.value)} placeholder="23" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">View Type</label>
              <input className={inp2} value={form.view_type||''} onChange={e => f('view_type', e.target.value)} placeholder="City view, Landmark view" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Free Cancellation Deadline</label>
              <input type="date" className={inp2} value={form.cancellation_deadline||''} onChange={e => f('cancellation_deadline', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select className={inp2} value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Room Image URL</label>
              <input className={inp2} value={form.image_url||''} onChange={e => f('image_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-6">
            {[
              { key: 'free_cancellation', label: 'Free Cancellation' },
              { key: 'no_prepayment', label: 'No Prepayment' },
              { key: 'is_recommended', label: 'Recommended Room' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form[key]} onChange={e => f(key, e.target.checked)} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Room Amenities</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.amenities.map(a => (
                <span key={a} className="flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {a}
                  <button onClick={() => f('amenities', form.amenities.filter(x => x !== a))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={inp2 + ' flex-1'} value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                placeholder="Add amenity..." onKeyDown={e => { if (e.key==='Enter' && newAmenity.trim()) { f('amenities',[...form.amenities, newAmenity.trim()]); setNewAmenity(''); }}} />
              <button onClick={() => { if (newAmenity.trim()) { f('amenities',[...form.amenities, newAmenity.trim()]); setNewAmenity(''); }}}
                className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">What's Included</label>
            <div className="space-y-1.5 mb-2">
              {form.inclusions.map((inc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">{inc}</span>
                  <button onClick={() => f('inclusions', form.inclusions.filter((_, idx) => idx !== i))}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={inp2 + ' flex-1'} value={newInclusion} onChange={e => setNewInclusion(e.target.value)}
                placeholder="e.g. Includes 1 parking spot + early check-in"
                onKeyDown={e => { if (e.key==='Enter' && newInclusion.trim()) { f('inclusions',[...form.inclusions, newInclusion.trim()]); setNewInclusion(''); }}} />
              <button onClick={() => { if (newInclusion.trim()) { f('inclusions',[...form.inclusions, newInclusion.trim()]); setNewInclusion(''); }}}
                className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm font-bold">Add</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-white">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-sm">
            {room ? 'Save Changes' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}