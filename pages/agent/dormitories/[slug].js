// pages/agent/dormitories/[slug].js
// Dormitory detail for agent/student - full detail inside AdminLayout
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import {
  MapPin, Home, CheckCircle, ChevronLeft, ChevronRight,
  X, BedDouble, Maximize2, ZoomIn, Users, Phone, Mail,
  Globe, ExternalLink, ArrowLeft, Loader2, Plus, Wifi,
  Shield, Clock, DollarSign, Building2, Star
} from 'lucide-react';

// ── Full-screen image viewer ──────────────────────────────────
function ImageViewer({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
      if (e.key === 'ArrowLeft')  setCurrent(c => (c - 1 + images.length) % images.length);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      <button onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10">
        <X className="w-5 h-5" />
      </button>
      <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
        {current + 1} / {images.length}
      </div>
      {images.length > 1 && (
        <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
          className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <img src={images[current]?.image_url} alt={images[current]?.caption || ''}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
      {images.length > 1 && (
        <button onClick={() => setCurrent(c => (c + 1) % images.length)}
          className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      {images[current]?.caption && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-4 py-2 rounded-full">
          {images[current].caption}
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <img src={img.image_url} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Photo Gallery ─────────────────────────────────────────────
function PhotoGallery({ images, onOpen }) {
  if (!images?.length) return (
    <div className="h-64 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-5">
      <div className="text-center">
        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No photos available</p>
      </div>
    </div>
  );

  const main = images[0];
  const side = images.slice(1, 5);

  return (
    <div className="relative mb-5">
      <div className={`grid gap-2 h-72 ${side.length === 0 ? '' : side.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${side.length >= 4 ? 'col-span-2 row-span-2' : 'col-span-2'}`}
          onClick={() => onOpen(0)}>
          <img src={main.image_url} alt={main.caption || 'Dormitory'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {side.map((img, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl cursor-pointer group" onClick={() => onOpen(i + 1)}>
            <img src={img.image_url} alt={img.caption || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {i === side.length - 1 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                +{images.length - 5}
              </div>
            )}
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <button onClick={() => onOpen(0)}
          className="absolute bottom-3 right-3 flex items-center gap-2 bg-white text-slate-800 font-bold text-xs px-3 py-2 rounded-xl shadow-lg hover:bg-slate-50 transition-colors border border-slate-200">
          <Maximize2 className="w-3.5 h-3.5" /> All {images.length} photos
        </button>
      )}
    </div>
  );
}

const AMENITY_ICONS_MAP = {
  'free wifi': Wifi, 'wifi': Wifi, 'security / cctv': Shield, 'security': Shield,
  '24-hour reception': Clock, 'bills included': DollarSign,
};

function AmenityTag({ name }) {
  const IconComp = AMENITY_ICONS_MAP[name?.toLowerCase()] || CheckCircle;
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
      <IconComp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      {name}
    </div>
  );
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, onApply, onImageClick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex">
        {/* Room photo */}
        <div className="w-44 h-40 shrink-0 relative overflow-hidden group cursor-pointer bg-slate-100"
          onClick={() => room.image_url && onImageClick(room.image_url)}>
          {room.image_url ? (
            <>
              <img src={room.image_url} alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <BedDouble className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-tight">{room.name}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
                  {room.bed_type && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3 text-slate-400" /> {room.bed_type}</span>}
                  {room.size_sqm && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3 text-slate-400" /> {room.size_sqm}m²</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> Max {room.max_guests || 1}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {room.original_price && (
                  <div className="text-xs text-slate-400 line-through">PKR {Number(room.original_price).toLocaleString()}</div>
                )}
                <div className="text-lg font-bold text-emerald-700">
                  PKR {Number(room.price_per_night || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">per month</div>
              </div>
            </div>

            {room.is_recommended == 1 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                ⭐ Recommended
              </span>
            )}

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {room.amenities.slice(0, expanded ? 999 : 3).map(a => (
                  <span key={a} className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{a}</span>
                ))}
                {!expanded && room.amenities.length > 3 && (
                  <button onClick={() => setExpanded(true)}
                    className="text-[11px] text-emerald-600 font-bold hover:underline">+{room.amenities.length - 3} more</button>
                )}
              </div>
            )}
          </div>

          {/* Apply button */}
          <div className="mt-3">
            <button onClick={onApply}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-100">
              <Plus className="w-3.5 h-3.5" /> Apply for this Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DormitoryDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const isStudent = router.pathname.startsWith('/student/');
  const basePath  = isStudent ? '/student' : '/agent';

  const [dorm,        setDorm]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [viewerOpen,  setViewerOpen]  = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const [roomImgOpen, setRoomImgOpen] = useState(false);
  const [roomImgUrl,  setRoomImgUrl]  = useState('');
  const [liked,       setLiked]       = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/admin/hotels/${slug.includes('-') ? '' : ''}`)
      .catch(() => {});
    // Use slug API
    fetch(`/api/hotels/${slug}`)
      .then(r => r.json())
      .then(d => { setDorm(d); setLoading(false); })
      .catch(() => {
        // Fallback: try admin hotels by slug
        fetch('/api/admin/hotels')
          .then(r => r.json())
          .then(d => {
            const found = (d.hotels || []).find(h => h.slug === slug);
            if (found) {
              fetch(`/api/admin/hotels/${found.id}`)
                .then(r => r.json())
                .then(detail => { setDorm(detail); setLoading(false); });
            } else {
              setLoading(false);
            }
          });
      });
  }, [slug]);

  function goApply(roomId) {
    const params = new URLSearchParams({ hotel: dorm.id });
    if (roomId) params.set('room', roomId);
    router.push(`${basePath}/dorm-applications/new?${params}`);
  }

  if (loading) return (
    <AdminLayout title="Dormitory Details">
      <div className="flex justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    </AdminLayout>
  );

  if (!dorm || dorm.error) return (
    <AdminLayout title="Dormitory Details">
      <div className="flex flex-col items-center py-24 text-slate-400">
        <Home className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-semibold text-slate-500">Dormitory not found</p>
        <button onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={dorm.name}>
      <div className="max-w-5xl mx-auto">

        {/* Back + Apply header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dormitories
          </button>
          <button onClick={() => goApply(null)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Apply Now
          </button>
        </div>

        {/* Gallery */}
        <PhotoGallery images={dorm.images || []} onOpen={i => { setViewerStart(i); setViewerOpen(true); }} />

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  Student Accommodation
                </span>
                {dorm.is_featured == 1 && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                    ⭐ Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'Georgia,serif', letterSpacing: '-0.02em' }}>
                {dorm.name}
              </h1>
              {(dorm.city || dorm.country) && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {[dorm.address, dorm.city, dorm.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Home,      label: 'Room Types',  value: dorm.rooms?.length || '—' },
                { icon: Users,     label: 'Max Guests',  value: dorm.rooms?.reduce((a, r) => a + (r.max_guests || 0), 0) || '—' },
                { icon: Building2, label: 'City',        value: dorm.city || '—' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{s.value}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {dorm.description && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-800 mb-3" style={{ fontFamily: 'Georgia,serif' }}>About This Dormitory</h2>
                <div className="space-y-2.5">
                  {dorm.description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {dorm.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily: 'Georgia,serif' }}>Facilities & Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dorm.amenities.map(a => (
                    <AmenityTag key={a.name || a} name={a.name || a} />
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            {dorm.rooms?.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-3" style={{ fontFamily: 'Georgia,serif' }}>
                  Available Rooms
                </h2>
                <div className="space-y-3">
                  {dorm.rooms.map(room => (
                    <RoomCard key={room.id} room={room}
                      onApply={() => goApply(room.id)}
                      onImageClick={url => { setRoomImgUrl(url); setRoomImgOpen(true); }} />
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {dorm.highlights?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-800 mb-3" style={{ fontFamily: 'Georgia,serif' }}>Highlights</h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {dorm.highlights.map(h => (
                    <div key={h.id || h.title} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{h.title}</div>
                        {h.description && <div className="text-xs text-slate-500 mt-0.5">{h.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <div className="sticky top-20 space-y-4">

              {/* Price range */}
              {dorm.rooms?.length > 0 && (() => {
                const prices = dorm.rooms.filter(r => r.price_per_night).map(r => Number(r.price_per_night));
                if (!prices.length) return null;
                const min = Math.min(...prices), max = Math.max(...prices);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Rent</div>
                    <div className="text-xl font-extrabold text-emerald-700">
                      {min === max ? `PKR ${min.toLocaleString()}` : `PKR ${min.toLocaleString()} – ${max.toLocaleString()}`}
                    </div>
                    <div className="text-xs text-slate-400 mb-4">per month</div>
                    <button onClick={() => goApply(null)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                      <Plus className="w-4 h-4" /> Apply Now
                    </button>
                  </div>
                );
              })()}

              {/* Location */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Location</div>
                <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                  <div className="text-center">
                    <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-xs text-slate-500 font-medium">{dorm.city}{dorm.country ? `, ${dorm.country}` : ''}</div>
                  </div>
                </div>
                {dorm.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    {dorm.address}
                  </div>
                )}
              </div>

              {/* Contact */}
              {(dorm.phone || dorm.email || dorm.website) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact</div>
                  <div className="space-y-2">
                    {dorm.phone && (
                      <a href={`tel:${dorm.phone}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 group">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-xs">{dorm.phone}</span>
                      </a>
                    )}
                    {dorm.email && (
                      <a href={`mailto:${dorm.email}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 group">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                          <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-xs truncate">{dorm.email}</span>
                      </a>
                    )}
                    {dorm.website && (
                      <a href={dorm.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 group">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-xs flex items-center gap-1">Website <ExternalLink className="w-3 h-3 opacity-50" /></span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Apply CTA */}
              <div className="bg-emerald-600 rounded-2xl p-4 text-white">
                <div className="font-bold text-sm mb-1">Interested?</div>
                <p className="text-xs text-emerald-100 mb-3">Apply now to secure your spot</p>
                <button onClick={() => goApply(null)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors">
                  <Plus className="w-4 h-4" /> Apply for Dormitory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery lightbox */}
      {viewerOpen && (
        <ImageViewer images={dorm.images || []} startIndex={viewerStart} onClose={() => setViewerOpen(false)} />
      )}

      {/* Room image lightbox */}
      {roomImgOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setRoomImgOpen(false)}>
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <img src={roomImgUrl} alt="Room"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </AdminLayout>
  );
}