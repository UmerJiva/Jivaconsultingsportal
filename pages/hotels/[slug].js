// pages/hotels/[slug].js — Student Dormitory Detail Page
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  MapPin, Heart, Share2, CheckCircle, ChevronLeft, ChevronRight,
  X, Home, Wifi, Users, Phone, Mail, Globe, Star,
  BedDouble, Maximize2, ArrowLeft, ZoomIn, ChevronDown,
  Building2, Shield, Clock, DollarSign, Info, ExternalLink
} from 'lucide-react';

// ── Full-screen image viewer ──────────────────────────────────
function ImageViewer({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  setCurrent(c => (c + 1) % images.length);
      if (e.key === 'ArrowLeft')   setCurrent(c => (c - 1 + images.length) % images.length);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
        {current + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
          className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]?.image_url}
        alt={images[current]?.caption || ''}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
      />

      {/* Next */}
      {images.length > 1 && (
        <button onClick={() => setCurrent(c => (c + 1) % images.length)}
          className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Caption */}
      {images[current]?.caption && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-4 py-2 rounded-full">
          {images[current].caption}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 mt-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
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
    <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
      <div className="text-center">
        <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No photos available</p>
      </div>
    </div>
  );

  const main = images[0];
  const side = images.slice(1, 5);

  return (
    <div className="relative mb-6">
      <div className={`grid gap-2 h-80 ${side.length === 0 ? '' : side.length === 1 ? 'grid-cols-2' : side.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>

        {/* Main image */}
        <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${side.length === 0 ? 'col-span-1' : side.length >= 4 ? 'col-span-2 row-span-2' : 'col-span-2'}`}
          onClick={() => onOpen(0)}>
          <img src={main.image_url} alt={main.caption || 'Dormitory'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {main.is_primary && (
            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Main Photo</div>
          )}
        </div>

        {/* Side images */}
        {side.map((img, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl cursor-pointer group"
            onClick={() => onOpen(i + 1)}>
            <img src={img.image_url} alt={img.caption || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Show count on last */}
            {i === side.length - 1 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                +{images.length - 5}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* See all photos button */}
      {images.length > 1 && (
        <button onClick={() => onOpen(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-slate-800 font-bold text-sm px-4 py-2 rounded-xl shadow-lg hover:bg-slate-50 transition-colors border border-slate-200">
          <Maximize2 className="w-4 h-4" />
          See all {images.length} photos
        </button>
      )}
    </div>
  );
}

// ── Amenity badge ─────────────────────────────────────────────
const AMENITY_ICONS_MAP = {
  'free wifi': Wifi, 'wifi': Wifi,
  'study room': Home, 'common kitchen': Home,
  'laundry': Home, 'air conditioning': Home, 'heating': Home,
  'elevator': Home, 'security / cctv': Shield, 'security': Shield,
  '24-hour reception': Clock, 'parking': Home,
  'gym / fitness': Users, 'common room / lounge': Home,
  'bills included': DollarSign,
};

function AmenityTag({ name }) {
  const IconComp = AMENITY_ICONS_MAP[name.toLowerCase()] || CheckCircle;
  return (
    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 font-medium hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
      <IconComp className="w-4 h-4 text-emerald-600 shrink-0" />
      {name}
    </div>
  );
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, onOpenImage }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex">
        {/* Room photo */}
        <div className="w-48 h-44 shrink-0 relative overflow-hidden group cursor-pointer bg-slate-100"
          onClick={() => room.image_url && onOpenImage(room.image_url)}>
          {room.image_url ? (
            <>
              <img src={room.image_url} alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <BedDouble className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">{room.name}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {room.bed_type && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" /> {room.bed_type}
                    </span>
                  )}
                  {room.size_sqm && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> {room.size_sqm} m²
                    </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Max {room.max_guests}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {room.actual_price && (
                  <div className="text-xs text-slate-400 line-through">
                    PKR {Number(room.actual_price).toLocaleString()}
                  </div>
                )}
                <div className="text-xl font-bold text-emerald-700">
                  PKR {Number(room.price_per_night || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">per month</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {room.is_recommended && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  ⭐ Recommended
                </span>
              )}
              {room.status === 'unavailable' && (
                <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded-full">
                  Unavailable
                </span>
              )}
            </div>

            {/* Amenities preview */}
            {room.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {room.amenities.slice(0, 4).map(a => (
                  <span key={a} className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                    {a}
                  </span>
                ))}
                {room.amenities.length > 4 && (
                  <button onClick={() => setOpen(o => !o)}
                    className="text-[11px] text-emerald-600 font-bold hover:underline">
                    +{room.amenities.length - 4} more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Inclusions */}
          {room.inclusions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {room.inclusions.map(inc => (
                <div key={inc} className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />{inc}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded amenities */}
      {open && room.amenities?.length > 4 && (
        <div className="px-5 pb-4 pt-0 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 mt-3">
            {room.amenities.map(a => (
              <span key={a} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DormitoryDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [dorm,         setDorm]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerStart,  setViewerStart]  = useState(0);
  const [roomImgOpen,  setRoomImgOpen]  = useState(false);
  const [roomImgUrl,   setRoomImgUrl]   = useState('');
  const [activeTab,    setActiveTab]    = useState('overview');
  const [liked,        setLiked]        = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/hotels/${slug}`)
      .then(r => r.json())
      .then(d => { setDorm(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  function openGallery(idx) {
    setViewerStart(idx);
    setViewerOpen(true);
  }

  function openRoomImage(url) {
    setRoomImgUrl(url);
    setRoomImgOpen(true);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!dorm || dorm.error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-4">
      <Home className="w-16 h-16 opacity-20" />
      <p className="text-lg font-semibold text-slate-500">Dormitory not found</p>
      <button onClick={() => router.push('/hotels')}
        className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Browse Dormitories
      </button>
    </div>
  );

  const TABS = [
    { key: 'overview',     label: 'Overview'     },
    { key: 'rooms',        label: `Rooms (${dorm.rooms?.length || 0})` },
    { key: 'facilities',   label: 'Facilities'   },
    { key: 'contact',      label: 'Contact'      },
  ];

  return (
    <>
      <Head><title>{dorm.name} | Student Accommodation</title></Head>

      <div className="min-h-screen bg-slate-50">

        {/* ── TOP NAV ── */}
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-0 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">

          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 mb-4">
            <button onClick={() => router.push('/hotels')} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> All Dormitories
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {dorm.country && <><span className="text-slate-400">{dorm.country}</span><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>}
            {dorm.city && <><span className="text-slate-400">{dorm.city}</span><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>}
            <span className="text-slate-600 font-medium truncate max-w-[200px]">{dorm.name}</span>
          </div>

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  Student Accommodation
                </span>
                {dorm.is_featured && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                    ⭐ Featured
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  dorm.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {dorm.status === 'active' ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2" style={{ fontFamily: 'Georgia,serif', letterSpacing: '-0.02em' }}>
                {dorm.name}
              </h1>
              {dorm.address && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{[dorm.address, dorm.city, dorm.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setLiked(l => !l)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
              </button>
              <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <Share2 className="w-5 h-5 text-slate-400" />
              </button>
              <a href={`#rooms`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
                View Rooms
              </a>
            </div>
          </div>

          {/* ── GALLERY ── */}
          <PhotoGallery images={dorm.images || []} onOpen={openGallery} />

          {/* ── LAYOUT ── */}
          <div className="flex gap-6">

            {/* ── MAIN ── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Home,     label: 'Rooms Available', value: dorm.rooms?.filter(r => r.status !== 'unavailable').length || '—' },
                  { icon: Users,    label: 'Total Rooms',     value: dorm.rooms?.length || '—' },
                  { icon: Building2,label: 'Location',        value: dorm.city || '—' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <s.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800">{s.value}</div>
                      <div className="text-xs text-slate-400 font-medium">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* About */}
              {dorm.description && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4" style={{ fontFamily: 'Georgia,serif' }}>About This Dormitory</h2>
                  <div className="space-y-3">
                    {dorm.description.split('\n\n').map((para, i) => (
                      <p key={i} className="text-sm text-slate-600 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {dorm.amenities?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="facilities">
                  <h2 className="text-lg font-bold text-slate-800 mb-4" style={{ fontFamily: 'Georgia,serif' }}>Facilities & Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {dorm.amenities.map(a => (
                      <AmenityTag key={a.name || a} name={a.name || a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rooms */}
              <div id="rooms">
                <h2 className="text-lg font-bold text-slate-800 mb-4" style={{ fontFamily: 'Georgia,serif' }}>
                  Available Rooms & Dormitories
                </h2>
                {dorm.rooms?.length === 0 || !dorm.rooms ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
                    <BedDouble className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-slate-500">No rooms listed yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dorm.rooms.map(room => (
                      <RoomCard key={room.id} room={room} onOpenImage={openRoomImage} />
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              {dorm.highlights?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4" style={{ fontFamily: 'Georgia,serif' }}>Property Highlights</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dorm.highlights.map(h => (
                      <div key={h.id || h.title} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
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

            {/* ── SIDEBAR ── */}
            <div className="w-72 shrink-0">
              <div className="sticky top-20 space-y-4">

                {/* Price range card */}
                {dorm.rooms?.length > 0 && (() => {
                  const prices = dorm.rooms.filter(r => r.price_per_night).map(r => Number(r.price_per_night));
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return prices.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Rent</div>
                      <div className="text-2xl font-extrabold text-emerald-700">
                        {min === max
                          ? `PKR ${min.toLocaleString()}`
                          : `PKR ${min.toLocaleString()} – ${max.toLocaleString()}`}
                      </div>
                      <div className="text-xs text-slate-400 mb-4">per month</div>
                      <a href="#rooms"
                        className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
                        View All Rooms
                      </a>
                    </div>
                  ) : null;
                })()}

                {/* Location card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Location</div>
                  {/* Map placeholder */}
                  <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center mb-3 border border-slate-200 overflow-hidden">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
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

                {/* Contact card */}
                {(dorm.phone || dorm.email || dorm.website) && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact</div>
                    <div className="space-y-2.5">
                      {dorm.phone && (
                        <a href={`tel:${dorm.phone}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 transition-colors group">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Phone className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium">{dorm.phone}</span>
                        </a>
                      )}
                      {dorm.email && (
                        <a href={`mailto:${dorm.email}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 transition-colors group">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Mail className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium truncate">{dorm.email}</span>
                        </a>
                      )}
                      {dorm.website && (
                        <a href={dorm.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600 transition-colors group">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Globe className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium flex items-center gap-1">Website <ExternalLink className="w-3 h-3 opacity-50" /></span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick enquiry CTA */}
                <div className="bg-emerald-600 rounded-2xl p-5 text-white">
                  <div className="font-bold text-base mb-1">Interested?</div>
                  <p className="text-sm text-emerald-100 mb-4">Contact us for availability and booking</p>
                  {dorm.phone && (
                    <a href={`tel:${dorm.phone}`}
                      className="flex items-center justify-center gap-2 w-full bg-white text-emerald-700 font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors">
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                  )}
                  {dorm.email && (
                    <a href={`mailto:${dorm.email}`}
                      className="flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-2">
                      <Mail className="w-4 h-4" /> Send Enquiry
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full gallery viewer ── */}
      {viewerOpen && (
        <ImageViewer
          images={dorm.images || []}
          startIndex={viewerStart}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* ── Single room image viewer ── */}
      {roomImgOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setRoomImgOpen(false)}>
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src={roomImgUrl} alt="Room"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}