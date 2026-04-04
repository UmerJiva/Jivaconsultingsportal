// pages/hotels/[slug].js — Full hotel detail page (Booking.com style)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  MapPin, Star, Heart, Share2, CheckCircle, ChevronDown,
  ChevronUp, Info, Wifi, ParkingCircle, Coffee, Shield,
  Users, Calendar, Plus, Minus, ChevronLeft, ChevronRight,
  X, ArrowRight
} from 'lucide-react';

// ── Score Badge ───────────────────────────────────────────────
function ScoreBadge({ score, label, count, large }) {
  const color = score >= 9 ? 'bg-emerald-700' : score >= 8 ? 'bg-blue-800' : 'bg-blue-600';
  return (
    <div className="flex items-center gap-2">
      <div>
        {label && <div className={`font-bold ${large ? 'text-base' : 'text-sm'} text-slate-800`}>{label}</div>}
        <div className="text-xs text-slate-500">{count} reviews</div>
      </div>
      <div className={`${color} text-white font-bold ${large ? 'text-xl px-3 py-2' : 'text-base px-2.5 py-1.5'} rounded-lg`}>
        {Number(score || 0).toFixed(1)}
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────
function Breadcrumb({ hotel }) {
  return (
    <div className="text-sm text-blue-600 flex items-center gap-1 flex-wrap">
      <span className="hover:underline cursor-pointer">Home</span>
      <ChevronRight className="w-3 h-3 text-slate-400" />
      <span className="hover:underline cursor-pointer">{hotel?.country}</span>
      <ChevronRight className="w-3 h-3 text-slate-400" />
      <span className="hover:underline cursor-pointer">{hotel?.city}</span>
      <ChevronRight className="w-3 h-3 text-slate-400" />
      <span className="text-slate-600">Search results</span>
    </div>
  );
}

// ── Photo Gallery ─────────────────────────────────────────────
function PhotoGallery({ images }) {
  const [showAll, setShowAll] = useState(false);
  if (!images?.length) return null;
  const primary = images[0];
  const secondary = images.slice(1, 3);
  const thumbnails = images.slice(3, 8);
  const extraCount = images.length - 8;

  return (
    <div className="mb-6">
      <div className="flex gap-2 h-72">
        {/* Main large image */}
        <div className="flex-1 relative overflow-hidden rounded-l-2xl">
          <img src={primary.image_url} alt={primary.caption || 'Hotel'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
        </div>
        {/* Right 2 images */}
        <div className="flex flex-col gap-2 w-64">
          {secondary.map((img, i) => (
            <div key={i} className={`flex-1 overflow-hidden ${i === 1 ? 'rounded-tr-2xl' : ''}`}>
              <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
      {/* Thumbnails row */}
      {thumbnails.length > 0 && (
        <div className="flex gap-2 mt-2">
          {thumbnails.map((img, i) => (
            <div key={i} className="relative flex-1 h-20 overflow-hidden rounded-xl cursor-pointer group">
              <img src={img.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              {i === thumbnails.length - 1 && extraCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                  +{extraCount} photos
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Amenity Icon ──────────────────────────────────────────────
const AMENITY_ICONS = {
  wifi: '📶', parking: '🅿️', pool: '🏊', gym: '💪', spa: '💆',
  restaurant: '🍽️', bar: '🍸', 'air conditioning': '❄️',
  'free wifi': '📶', 'free parking': '🅿️', kitchen: '🍳',
  shower: '🚿', tv: '📺', 'private bathroom': '🛁',
  'pet friendly': '🐾', 'flat-screen tv': '📺',
  apartments: '🏠', view: '👁️', coffee: '☕',
};

function AmenityBadge({ name }) {
  const icon = AMENITY_ICONS[name.toLowerCase()] || '✓';
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700">
      <span>{icon}</span> {name}
    </div>
  );
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, nights, adults, onReserve }) {
  const totalPrice = room.price_per_night * nights;
  const originalTotal = room.original_price ? room.original_price * nights : null;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-700 text-white text-xs font-bold">
            <th className="text-left px-4 py-3">Room type</th>
            <th className="px-4 py-3">Number of guests</th>
            <th className="px-4 py-3">Price for {nights} night{nights > 1 ? 's' : ''}</th>
            <th className="px-4 py-3">Your choices</th>
            <th className="px-4 py-3">Select amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100 align-top">
            {/* Room type */}
            <td className="px-4 py-4 min-w-[200px]">
              <div className="font-bold text-blue-700 hover:underline cursor-pointer mb-1">{room.name}</div>
              {room.is_recommended && (
                <div className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                  Recommended for {adults} adult{adults > 1 ? 's' : ''}
                </div>
              )}
              {room.bed_type && <div className="text-xs text-slate-500 mb-2">🛏️ {room.bed_type}</div>}
              <div className="flex flex-wrap gap-1 mb-2">
                {room.size_sqm && <span className="text-[10px] border border-slate-200 px-1.5 py-0.5 rounded">{room.size_sqm} m²</span>}
                {room.view_type && room.view_type.split(',').map(v => (
                  <span key={v} className="text-[10px] border border-slate-200 px-1.5 py-0.5 rounded">{v.trim()}</span>
                ))}
                {room.amenities?.slice(0, 3).map(a => (
                  <span key={a} className="text-[10px] border border-slate-200 px-1.5 py-0.5 rounded">{a}</span>
                ))}
              </div>
              {/* Room amenities list */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-slate-600">
                  {room.amenities.map(a => (
                    <div key={a} className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-slate-400 shrink-0" /> {a}
                    </div>
                  ))}
                </div>
              )}
            </td>

            {/* Guests */}
            <td className="px-4 py-4 text-center">
              <div className="flex justify-center gap-1">
                {Array.from({length: Math.min(room.max_guests || 2, 4)}).map((_,i) => (
                  <span key={i} className="text-lg">👤</span>
                ))}
              </div>
            </td>

            {/* Price */}
            <td className="px-4 py-4 text-center whitespace-nowrap">
              {originalTotal && (
                <div className="text-slate-400 line-through text-xs mb-0.5">
                  PKR {Math.round(originalTotal).toLocaleString()}
                </div>
              )}
              <div className="text-xl font-bold text-slate-900">
                PKR {Math.round(totalPrice).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Includes taxes and fees</div>
              {room.discount_percent > 0 && (
                <div className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                  {room.discount_percent}% off
                </div>
              )}
              {room.has_deal && (
                <div className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 block">
                  Getaway Deal
                </div>
              )}
            </td>

            {/* Choices */}
            <td className="px-4 py-4 min-w-[180px]">
              {room.inclusions?.map(inc => (
                <div key={inc} className="flex items-start gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{inc}
                </div>
              ))}
              {room.free_cancellation && (
                <div className="flex items-start gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Free cancellation{room.cancellation_deadline ? ` before ${new Date(room.cancellation_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}` : ''}</span>
                </div>
              )}
              {room.no_prepayment && (
                <div className="flex items-start gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  No prepayment needed – pay at the property
                </div>
              )}
            </td>

            {/* Select amount */}
            <td className="px-4 py-4 text-center">
              <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400">
                {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </td>

            {/* Reserve */}
            <td className="px-4 py-4 text-center">
              <button
                onClick={() => onReserve(room)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap shadow-sm">
                I'll reserve
              </button>
              <div className="text-[10px] text-slate-400 mt-1">• You won't be charged yet</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function HotelDetailPage() {
  const router = useRouter();
  const { slug, checkIn, checkOut, adults, children, rooms } = router.query;

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSignIn, setShowSignIn] = useState(true);
  const overviewRef = useRef(null);
  const availRef = useRef(null);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24)))
    : 28;
  const gAdults = parseInt(adults) || 2;
  const gRooms  = parseInt(rooms) || 1;

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/hotels/${slug}?checkIn=${checkIn||''}&checkOut=${checkOut||''}&adults=${adults||2}`)
      .then(r => r.json())
      .then(d => { setHotel(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug, checkIn, checkOut, adults]);

  function handleReserve(room) {
    const params = new URLSearchParams({
      hotelId: hotel.id, roomId: room.id,
      checkIn: checkIn || '', checkOut: checkOut || '',
      adults: adults || 2, children: children || 0, rooms: rooms || 1,
    });
    router.push(`/hotels/reserve?${params}`);
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Hotel not found</div>
  );

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'availability', label: 'Availability' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'rules', label: 'House rules' },
    { key: 'legal', label: 'Important and legal info' },
    { key: 'reviews', label: `Guest reviews (${hotel.review_count || 0})` },
  ];

  return (
    <>
      <Head><title>{hotel.name} – Hotel Booking</title></Head>
      <div className="min-h-screen bg-white">

        {/* ── TABS BAR ── */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-0 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-5">
          <Breadcrumb hotel={hotel} />

          {/* ── HOTEL HEADER ── */}
          <div className="flex items-start justify-between gap-4 mt-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Stars */}
                <div className="flex">
                  {Array.from({length: hotel.star_rating || 3}).map((_,i) => (
                    <span key={i} className="text-yellow-400 text-sm">⭐</span>
                  ))}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
                <span className="text-slate-300">–</span>
                <button className="font-bold hover:underline">Great location - show map</button>
                <span className="text-slate-300">–</span>
                <span className="text-slate-500">Subway/metro & Train Access</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
                <Heart className="w-5 h-5 text-slate-500" />
              </button>
              <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
                <Share2 className="w-5 h-5 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Reserve
              </button>
            </div>
          </div>

          {/* ── PHOTO GALLERY ── */}
          <PhotoGallery images={hotel.images || []} />

          <div className="flex gap-6">
            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-w-0">

              {/* Score + Wifi row */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-2xl">
                <ScoreBadge score={hotel.review_score} label={hotel.review_label} count={hotel.review_count} large />
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Free Wifi
                  <div className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded">10</div>
                </div>
              </div>

              {/* Amenity badges */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {hotel.amenities.map(a => (
                    <AmenityBadge key={a.name} name={a.name} />
                  ))}
                </div>
              )}

              {/* Sign-in banner */}
              {showSignIn && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                  <div>
                    <div className="font-bold text-slate-800 text-sm mb-0.5">Sign in, save money</div>
                    <div className="text-xs text-slate-500">Sign in to see if you can save 10% or more at this property.</div>
                    <div className="flex gap-3 mt-2">
                      <button className="text-sm font-bold text-blue-600 border border-blue-300 px-4 py-1.5 rounded-lg hover:bg-blue-50">Sign in</button>
                      <button className="text-sm text-blue-600 hover:underline">Create an account</button>
                    </div>
                  </div>
                  <div className="text-5xl">🎁</div>
                  <button onClick={() => setShowSignIn(false)} className="text-slate-400 hover:text-slate-600 self-start">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Availability section */}
              <div ref={availRef} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-slate-900">Availability</h2>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Prices converted to PKR
                  </span>
                </div>

                {/* Date + guests search */}
                <div className="flex gap-2 items-center mb-4 p-3 border border-[#f5a623] rounded-xl bg-[#fef9f0]">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {checkIn ? new Date(checkIn).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : 'Check-in'}
                    <span className="text-slate-300 mx-1">—</span>
                    {checkOut ? new Date(checkOut).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : 'Check-out'}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                    <Users className="w-4 h-4 text-slate-400" />
                    {gAdults} adults · {parseInt(children)||0} children · {gRooms} rooms
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <button
                    onClick={() => router.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                    Change search
                  </button>
                </div>

                {/* Recommended section */}
                {hotel.rooms && hotel.rooms.some(r => r.is_recommended) && (
                  <div className="mb-4 p-4 border border-slate-200 rounded-2xl">
                    <div className="font-bold text-slate-800 mb-3">Recommended for {gAdults} adults</div>
                    {hotel.rooms.filter(r => r.is_recommended).map(room => {
                      const totalPrice = room.price_per_night * nights;
                      const origTotal = room.original_price ? room.original_price * nights : null;
                      return (
                        <div key={room.id} className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold text-blue-700 mb-0.5">1 × {room.name}</div>
                            <div className="text-xs text-slate-500 mb-1">Price for: {Array.from({length:gAdults}).map((_,i)=>'👤').join('')}</div>
                            <div className="text-xs text-slate-500 mb-2">🛏️ {room.bed_type}</div>
                            {room.free_cancellation && (
                              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Free cancellation before {room.cancellation_deadline ? new Date(room.cancellation_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : 'check-in'}
                                <span className="text-slate-400 font-normal cursor-pointer">❓</span>
                              </div>
                            )}
                            {room.no_prepayment && (
                              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle className="w-3 h-3" /> No prepayment needed – pay at the property
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-slate-500">{nights > 6 ? `${Math.round(nights/7)} weeks` : `${nights} nights`}, {gAdults} adults</div>
                            {origTotal && <div className="text-sm text-slate-400 line-through">PKR {Math.round(origTotal).toLocaleString()}</div>}
                            <div className="text-xl font-bold text-slate-900">PKR {Math.round(totalPrice).toLocaleString()}</div>
                            <div className="text-xs text-slate-400 mb-2">Includes taxes and fees</div>
                            {room.has_deal && <div className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2">Getaway Deal</div>}
                            <button
                              onClick={() => handleReserve(room)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">
                              Reserve
                            </button>
                            <div className="text-[10px] text-slate-400 mt-1">You won't be charged yet</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* About */}
                {hotel.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">About this property</h3>
                    {hotel.description.split('\n\n').map((para, i) => (
                      <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3">{para}</p>
                    ))}
                  </div>
                )}

                {/* Most popular facilities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Most popular facilities</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {hotel.amenities.slice(0, 10).map(a => (
                        <div key={a.name} className="flex items-center gap-2 text-sm text-slate-700">
                          <span>{AMENITY_ICONS[a.name.toLowerCase()] || '✓'}</span> {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All available rooms */}
                <h3 className="text-lg font-bold text-slate-800 mb-3">All available apartments</h3>
                {hotel.rooms && hotel.rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    nights={nights}
                    adults={gAdults}
                    onReserve={handleReserve}
                  />
                ))}
              </div>

              {/* Reviews */}
              {hotel.reviews && hotel.reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Guest reviews</h3>
                  <div className="space-y-4">
                    {hotel.reviews.map(review => (
                      <div key={review.id} className="border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-slate-800">{review.reviewer_name}</div>
                            <div className="text-xs text-slate-400">{review.reviewer_country} · {new Date(review.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</div>
                          </div>
                          <div className="bg-blue-600 text-white font-bold text-sm px-2 py-1 rounded-lg">{Number(review.score).toFixed(1)}</div>
                        </div>
                        {review.positive_review && (
                          <div className="text-sm text-slate-700 mb-1">
                            <span className="text-emerald-600 font-bold">+ </span>{review.positive_review}
                          </div>
                        )}
                        {review.negative_review && (
                          <div className="text-sm text-slate-600">
                            <span className="text-red-500 font-bold">- </span>{review.negative_review}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div className="w-80 shrink-0">
              <div className="sticky top-20 space-y-4">

                {/* Score card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <ScoreBadge score={hotel.review_score} label={hotel.review_label} count={hotel.review_count} large />
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="font-semibold text-slate-700">Free Wifi</span>
                    <div className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded">10</div>
                  </div>
                </div>

                {/* Map */}
                <div className="bg-slate-100 rounded-2xl overflow-hidden h-44 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-slate-700">{hotel.city}, {hotel.country}</div>
                    </div>
                  </div>
                  <button className="absolute bottom-3 inset-x-3 bg-blue-600 text-white font-bold py-2 rounded-xl text-sm text-center hover:bg-blue-700 transition-colors">
                    Show on map
                  </button>
                </div>

                {/* Property highlights */}
                {hotel.highlights && hotel.highlights.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <h3 className="font-bold text-slate-800 mb-3">Property highlights</h3>
                    {nights > 20 && (
                      <div className="font-bold text-slate-700 text-sm mb-2">
                        Perfect for a {Math.round(nights/7)}-week stay!
                      </div>
                    )}
                    {hotel.highlights.map(h => (
                      <div key={h.id} className="flex items-start gap-2 text-sm text-slate-700 mb-1.5">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{h.title}</div>
                          {h.description && <div className="text-xs text-slate-500">{h.description}</div>}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleReserve(hotel.rooms?.[0])}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                      Reserve
                    </button>
                  </div>
                )}

                {/* Genius discount */}
                <div className="border border-slate-200 rounded-2xl p-4 text-sm text-slate-600">
                  You might be eligible for a Genius discount at {hotel.name}.{' '}
                  <button className="text-blue-600 font-bold hover:underline">Sign in</button>{' '}
                  to check if a Genius discount is available for your selected dates.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// const AMENITY_ICONS = {
//   wifi: '📶', 'free wifi': '📶', parking: '🅿️', 'free parking': '🅿️',
//   pool: '🏊', spa: '💆', restaurant: '🍽️', bar: '🍸',
//   'air conditioning': '❄️', kitchen: '🍳', shower: '🚿', tv: '📺',
//   'flat-screen tv': '📺', 'private bathroom': '🛁', 'pet friendly': '🐾',
//   apartments: '🏠', view: '👁️', '24-hour front desk': '🕐',
//   terrace: '🌿', heating: '🔥', laundry: '👕', 'daily housekeeping': '✨',
//   'designated smoking area': '🚬', 'swimming pool': '🏊',
// };