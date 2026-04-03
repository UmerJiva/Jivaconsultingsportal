// pages/hotels/index.js — Public hotel search, EduPortal brand colors
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Search, Bed, Calendar, Users, ChevronDown, Plus, Minus,
  Wifi, ParkingCircle, CheckCircle, Star, Shield, Headphones
} from 'lucide-react';

function GuestPicker({ value, onChange, onClose }) {
  const [local, setLocal] = useState(value);
  function adjust(key, delta) {
    setLocal(p => ({ ...p, [key]: Math.max(key === 'adults' ? 1 : 0, (p[key] || 0) + delta) }));
  }
  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 min-w-[300px]">
      {[
        { key: 'adults',   label: 'Adults',   sub: 'Age 18+', min: 1 },
        { key: 'children', label: 'Children', sub: 'Age 0–17', min: 0 },
        { key: 'rooms',    label: 'Rooms',    sub: '',         min: 1 },
      ].map(({ key, label, sub, min }) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
          <div>
            <div className="font-semibold text-slate-800 text-sm">{label}</div>
            {sub && <div className="text-xs text-slate-400">{sub}</div>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => adjust(key, -1)} disabled={local[key] <= min}
              className="w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 flex items-center justify-center disabled:opacity-30 hover:bg-emerald-50 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold text-slate-800">{local[key]}</span>
            <button onClick={() => adjust(key, 1)}
              className="w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400">Traveling with pets?</p>
        <p className="text-xs text-emerald-600 hover:underline cursor-pointer mt-0.5">Read more about traveling with assistance animals</p>
      </div>
      <button onClick={() => { onChange(local); onClose(); }}
        className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm">
        Done
      </button>
    </div>
  );
}

const WHY_CARDS = [
  { icon: '📋', title: 'Book now, pay at the property',          sub: 'FREE cancellation on most rooms'             },
  { icon: '⭐', title: '300M+ reviews from fellow travelers',     sub: 'Get trusted information from guests like you' },
  { icon: '🌍', title: '2+ million properties worldwide',        sub: 'Hotels, guest houses, apartments, and more...' },
  { icon: '🎧', title: 'Trusted 24/7 customer service',          sub: "We're always here to help"                   },
];

export default function HotelsHomePage() {
  const router = useRouter();
  const [destination,   setDestination]   = useState('');
  const [checkIn,       setCheckIn]       = useState('');
  const [checkOut,      setCheckOut]      = useState('');
  const [guests,        setGuests]        = useState({ adults: 2, children: 0, rooms: 1 });
  const [showPicker,    setShowPicker]    = useState(false);

  const guestLabel = `${guests.adults} adult${guests.adults > 1 ? 's' : ''} · ${guests.children} children · ${guests.rooms} room${guests.rooms > 1 ? 's' : ''}`;

  function handleSearch() {
    if (!destination.trim()) return;
    const p = new URLSearchParams({
      destination, checkIn: checkIn || '', checkOut: checkOut || '',
      adults: guests.adults, children: guests.children, rooms: guests.rooms,
    });
    router.push(`/hotels/search?${p}`);
  }

  return (
    <>
      <Head><title>Find Hotels | EduPortal</title></Head>
      <div className="min-h-screen bg-slate-50">

        {/* ── Hero ── */}
        <div className="bg-emerald-700 relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-14">
            <div className="mb-2">
              <span className="text-emerald-200 text-sm font-semibold tracking-wide uppercase">Accommodation Search</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia,serif' }}>
              Find your next stay
            </h1>
            <p className="text-emerald-100 text-lg mb-8">Search deals on hotels, homes, and much more...</p>

            {/* ── Search bar ── */}
            <div className="bg-amber-400 p-1.5 rounded-2xl shadow-2xl">
              <div className="flex items-stretch gap-1.5">
                {/* Destination */}
                <div className="flex-1 bg-white rounded-xl flex items-center gap-3 px-4 py-3 min-w-0">
                  <Bed className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Where are you going?"
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400 text-sm font-medium bg-transparent min-w-0"
                  />
                </div>

                {/* Dates */}
                <div className="bg-white rounded-xl flex items-center gap-2 px-4 py-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    className="outline-none text-slate-700 text-sm bg-transparent w-[105px]" />
                  <span className="text-slate-300 font-medium">—</span>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                    className="outline-none text-slate-700 text-sm bg-transparent w-[105px]" />
                </div>

                {/* Guests */}
                <div className="relative">
                  <button onClick={() => setShowPicker(p => !p)}
                    className="bg-white rounded-xl flex items-center gap-2 px-4 py-3 h-full text-sm font-medium text-slate-700 whitespace-nowrap hover:bg-slate-50 transition-colors">
                    <Users className="w-5 h-5 text-slate-400" />
                    {guestLabel}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  {showPicker && (
                    <GuestPicker value={guests} onChange={setGuests} onClose={() => setShowPicker(false)} />
                  )}
                </div>

                {/* Search button */}
                <button onClick={handleSearch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl transition-colors text-base shadow-sm flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Why cards ── */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'Georgia,serif' }}>Why Book With Us?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {WHY_CARDS.map(card => (
              <div key={card.title} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="text-4xl mb-3">{card.icon}</div>
                <div className="font-bold text-slate-800 text-sm leading-snug mb-1">{card.title}</div>
                <div className="text-xs text-slate-500">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Offers ── */}
          <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Georgia,serif' }}>Offers</h2>
          <p className="text-slate-500 mb-5 text-sm">Promotions, deals, and special offers for you</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex items-stretch hover:shadow-md transition-all">
            <div className="flex-1 p-6">
              <div className="text-xs text-slate-400 font-medium mb-1">Escape for less with our Getaway Deals</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Georgia,serif' }}>No catch. Just getaways.</h3>
              <p className="text-slate-500 text-sm mb-5">At least 15% off select stays worldwide – just book and go.</p>
              <button onClick={() => router.push('/hotels/search?deal=getaway')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
                Save with a Getaway Deal
              </button>
            </div>
            <div className="w-56 shrink-0 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop"
                alt="Beach" className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}