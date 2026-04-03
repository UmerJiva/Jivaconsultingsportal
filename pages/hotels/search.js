// pages/hotels/search.js — Search results, EduPortal style
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Search, MapPin, Calendar, Users, ChevronDown, Heart,
  Star, CheckCircle, ArrowUpDown, X, Minus, Plus,
  ChevronRight, Loader2, Hotel, Filter
} from 'lucide-react';

function ScoreBadge({ score, label, count }) {
  if (!score) return null;
  const color = score >= 9 ? 'bg-emerald-700' : score >= 8 ? 'bg-emerald-600' : 'bg-emerald-500';
  return (
    <div className="text-right">
      <div className="flex items-center gap-2 justify-end mb-0.5">
        <span className="text-sm font-semibold text-slate-700">{label || 'Good'}</span>
        <span className={`${color} text-white font-bold text-sm px-2.5 py-1 rounded-xl`}>{Number(score).toFixed(1)}</span>
      </div>
      <div className="text-xs text-slate-400">{count} reviews</div>
    </div>
  );
}

function GuestPicker({ value, onChange, onClose }) {
  const [local, setLocal] = useState(value);
  function adjust(key, delta) {
    setLocal(p => ({ ...p, [key]: Math.max(key === 'adults' ? 1 : 0, (p[key] || 0) + delta) }));
  }
  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 min-w-[280px]">
      {[
        { key: 'adults',   label: 'Adults',   min: 1 },
        { key: 'children', label: 'Children', min: 0 },
        { key: 'rooms',    label: 'Rooms',    min: 1 },
      ].map(({ key, label, min }) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => adjust(key, -1)} disabled={local[key] <= min}
              className="w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 flex items-center justify-center disabled:opacity-30 hover:bg-emerald-50">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 text-center font-bold text-sm">{local[key]}</span>
            <button onClick={() => adjust(key, 1)}
              className="w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 flex items-center justify-center hover:bg-emerald-50">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => { onChange(local); onClose(); }}
        className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
        Done
      </button>
    </div>
  );
}

const POPULAR_FILTERS = ['Spa', "Guests' favorite", 'Score 9+', 'Kitchen', 'Pet friendly', 'Free parking', 'Pool'];

export default function HotelSearchPage() {
  const router = useRouter();
  const { destination, checkIn, checkOut, adults, children, rooms } = router.query;

  const [hotels,   setHotels]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  const [dest,     setDest]     = useState('');
  const [ci,       setCi]       = useState('');
  const [co,       setCo]       = useState('');
  const [guests,   setGuests]   = useState({ adults: 2, children: 0, rooms: 1 });
  const [showPicker, setShowPicker] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [budgetMax, setBudgetMax] = useState(100000);

  useEffect(() => {
    if (!router.isReady) return;
    setDest(destination || '');
    setCi(checkIn || '');
    setCo(checkOut || '');
    setGuests({ adults: parseInt(adults) || 2, children: parseInt(children) || 0, rooms: parseInt(rooms) || 1 });
    fetchHotels();
  }, [router.isReady, destination, checkIn, checkOut, adults, children, rooms]);

  async function fetchHotels() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (destination) p.set('destination', destination);
      if (checkIn)     p.set('checkIn', checkIn);
      if (checkOut)    p.set('checkOut', checkOut);
      if (adults)      p.set('adults', adults);
      if (children)    p.set('children', children);
      if (rooms)       p.set('rooms', rooms);
      const data = await fetch(`/api/hotels/search?${p}`).then(r => r.json());
      setHotels(data.hotels || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }

  function handleSearch() {
    const p = new URLSearchParams({
      destination: dest, checkIn: ci || '', checkOut: co || '',
      adults: guests.adults, children: guests.children, rooms: guests.rooms,
    });
    router.push(`/hotels/search?${p}`);
  }

  function viewHotel(hotel) {
    const p = new URLSearchParams({
      checkIn: ci || '', checkOut: co || '',
      adults: guests.adults, children: guests.children, rooms: guests.rooms,
    });
    router.push(`/hotels/${hotel.slug}?${p}`);
  }

  const nights = ci && co ? Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / 86400000)) : 28;
  const gAdults = parseInt(adults) || 2;
  const gRooms  = parseInt(rooms)  || 1;
  const guestLabel = `${guests.adults} adult${guests.adults > 1 ? 's' : ''} · ${guests.children} children · ${guests.rooms} room${guests.rooms > 1 ? 's' : ''}`;

  return (
    <>
      <Head><title>{destination || 'Hotels'}: Search results</title></Head>
      <div className="min-h-screen bg-slate-50">

        {/* ── Sticky search bar ── */}
        <div className="bg-emerald-700 py-3 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-amber-400 p-1.5 rounded-xl flex items-stretch gap-1.5">
              {/* Destination */}
              <div className="flex-1 bg-white rounded-lg flex items-center gap-3 px-3 py-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input value={dest} onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Where are you going?" className="flex-1 outline-none text-sm text-slate-800 placeholder-slate-400 bg-transparent min-w-0" />
                {dest && <button onClick={() => setDest('')}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>}
              </div>
              {/* Dates */}
              <div className="bg-white rounded-lg flex items-center gap-2 px-3 py-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" value={ci} onChange={e => setCi(e.target.value)} className="outline-none text-sm text-slate-700 bg-transparent w-[100px]" />
                <span className="text-slate-300">—</span>
                <input type="date" value={co} onChange={e => setCo(e.target.value)} className="outline-none text-sm text-slate-700 bg-transparent w-[100px]" />
              </div>
              {/* Guests */}
              <div className="relative">
                <button onClick={() => setShowPicker(p => !p)}
                  className="bg-white rounded-lg flex items-center gap-2 px-3 py-2.5 h-full text-sm text-slate-700 whitespace-nowrap hover:bg-slate-50 transition-colors">
                  <Users className="w-4 h-4 text-slate-400" />
                  {guestLabel}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showPicker && <GuestPicker value={guests} onChange={setGuests} onClose={() => setShowPicker(false)} />}
              </div>
              <button onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-lg text-sm transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* ── Breadcrumb ── */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="text-sm text-emerald-600 flex items-center gap-1">
            <span className="hover:underline cursor-pointer" onClick={() => router.push('/hotels')}>Home</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600 font-medium">{destination || 'Search results'}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-10 flex gap-5">

          {/* ── Sidebar filters ── */}
          <div className="w-64 shrink-0 space-y-4">

            {/* Map */}
            <div className="bg-slate-200 rounded-2xl h-36 overflow-hidden relative border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-slate-200 flex items-center justify-center">
                <button className="bg-emerald-600 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors">
                  <MapPin className="w-4 h-4" /> Show on map
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-3 text-sm">Filter by:</h3>

              {/* Budget */}
              <div className="mb-4">
                <div className="font-semibold text-slate-700 mb-1 text-xs uppercase tracking-wide">Budget (per night)</div>
                <div className="text-xs text-slate-600 mb-2">PKR 6,000 – PKR {budgetMax.toLocaleString()}+</div>
                <div className="h-10 bg-slate-100 rounded-lg mb-2 flex items-end px-1 gap-px overflow-hidden">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 bg-emerald-400 rounded-sm opacity-50" style={{ height: `${20 + Math.random() * 70}%` }} />
                  ))}
                </div>
                <input type="range" min={6000} max={200000} value={budgetMax} onChange={e => setBudgetMax(parseInt(e.target.value))}
                  className="w-full accent-emerald-600" />
              </div>

              {/* Popular filters */}
              <div className="mb-4">
                <div className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wide">Popular filters</div>
                <div className="space-y-1.5">
                  {POPULAR_FILTERS.map(f => (
                    <label key={f} className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => setActiveFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          activeFilters.includes(f) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 group-hover:border-emerald-400'
                        }`}>
                        {activeFilters.includes(f) && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Smart filter */}
              <div>
                <div className="font-semibold text-slate-700 mb-1 text-xs uppercase tracking-wide flex items-center gap-1">
                  <span>✨</span> Smart filters
                </div>
                <textarea placeholder="I want a place with great reviews and free cancellation..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs resize-none h-16 focus:outline-none focus:border-emerald-400 placeholder-slate-300 mt-1" />
                <button className="text-emerald-600 font-semibold text-xs hover:underline mt-1">Find properties</button>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia,serif' }}>
                {destination || 'Search results'}:
                <span className="text-slate-500 font-normal ml-2 text-lg">
                  {loading ? '...' : `${total} properties found`}
                </span>
              </h1>
              <button className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort by: Most relevant first
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
                <Hotel className="w-16 h-16 mb-4 opacity-20" />
                <div className="text-xl font-bold text-slate-600 mb-1">No properties found</div>
                <div className="text-sm mb-4">Try a different destination or adjust your dates</div>
                <button onClick={() => router.push('/hotels')}
                  className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors">
                  New Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {hotels.map((hotel) => {
                  const totalPrice    = Number(hotel.min_price || 0) * nights * gRooms;
                  const originalTotal = hotel.original_price ? Number(hotel.original_price) * nights * gRooms : null;

                  return (
                    <div key={hotel.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex cursor-pointer group"
                      onClick={() => viewHotel(hotel)}>

                      {/* Image */}
                      <div className="w-56 h-56 shrink-0 relative overflow-hidden">
                        <img
                          src={hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button onClick={e => e.stopPropagation()}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors">
                          <Heart className="w-4 h-4 text-slate-500 hover:text-red-500" />
                        </button>
                        {hotel.is_featured && (
                          <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">Featured</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="font-bold text-emerald-700 text-lg leading-tight group-hover:underline">{hotel.name}</h3>
                                {/* Stars */}
                                <div className="flex gap-0.5">
                                  {Array.from({ length: hotel.star_rating || 3 }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  ))}
                                </div>
                                {hotel.is_featured && (
                                  <span className="text-[10px] border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Featured</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-emerald-600">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{hotel.city}, {hotel.country}</span>
                                <span className="text-slate-300">|</span>
                                <button className="hover:underline">Show on map</button>
                                <span className="text-slate-400">· 3.3 km from downtown</span>
                              </div>

                              {/* Badges */}
                              {hotel.has_deal && (
                                <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mt-2">
                                  Getaway Deal
                                </span>
                              )}

                              {/* Recommended room */}
                              {hotel.recommended_room && (
                                <div className="mt-2.5 border border-slate-100 bg-slate-50/50 rounded-xl p-3">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommended for your group</div>
                                  <div className="font-semibold text-sm text-slate-800 mb-0.5">{hotel.recommended_room}</div>
                                  {hotel.bed_type && <div className="text-xs text-slate-500">🛏️ {hotel.bed_type}</div>}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                      <CheckCircle className="w-3 h-3" /> Free cancellation
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                      <CheckCircle className="w-3 h-3" /> No prepayment needed
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <ScoreBadge score={hotel.review_score} label={hotel.review_label} count={hotel.review_count} />
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-end justify-between pt-3 border-t border-slate-100 mt-2">
                          <div className="text-xs text-slate-400">
                            {nights > 6 ? `${Math.round(nights / 7)} week${Math.round(nights / 7) > 1 ? 's' : ''}` : `${nights} night${nights > 1 ? 's' : ''}`}, {gAdults} adult{gAdults > 1 ? 's' : ''}
                          </div>
                          <div className="text-right">
                            {originalTotal && (
                              <div className="text-sm text-slate-400 line-through">PKR {Math.round(originalTotal).toLocaleString()}</div>
                            )}
                            <div className="text-xl font-bold text-slate-900">
                              PKR {Math.round(totalPrice).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mb-2">Includes taxes and fees</div>
                            <button
                              onClick={e => { e.stopPropagation(); viewHotel(hotel); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-200">
                              See availability <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}