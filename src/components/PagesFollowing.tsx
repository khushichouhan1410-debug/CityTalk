import React, { useState } from 'react';
import { Eye, Check, Users, ShieldAlert, Sparkles, Building, PhoneCall, Radio, Send, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LocalPage {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  category: string;
  followers: number;
  followed: boolean;
  statusUpdate: string;
  isAuthority?: boolean;
}

const INITIAL_PAGES: LocalPage[] = [
  {
    id: 'p-auth-1',
    name: 'Indore Municipal Authority (IMC)',
    handle: 'indore_municipal',
    avatar: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&q=80&w=200&h=200',
    category: 'Government / Civic',
    followers: 12450,
    followed: true,
    statusUpdate: '🧹 Swachh Survekshan Week: Special solid waste pickup teams deployed in Zone 9 Vijay Nagar today. Call 1011 for bulk queries.',
    isAuthority: true
  },
  {
    id: 'p-club-1',
    name: 'Vijay Nagar Activity Pioneers 🎾',
    handle: 'vijay_nagar_sports',
    avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    category: 'Sports & Games',
    followers: 840,
    followed: false,
    statusUpdate: '🏆 Registrations open for Indore Society Chess Cup scheduled on June 15th at Geeta Bhawan. Open entries for children and seniors!'
  },
  {
    id: 'p-food-1',
    name: 'The Indori Food Explorer 🌶️',
    handle: 'indori_food_review',
    avatar: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200&h=200',
    category: 'Food, Cafe & Reviews',
    followers: 3200,
    followed: true,
    statusUpdate: '🔥 Found the best butter-sponge Poha and Jalebi stall under Bapat Bridge! Serving from 5:30 AM daily.'
  },
  {
    id: 'p-civic-2',
    name: 'Society Safety Watch Indore',
    handle: 'city_safety_alliance',
    avatar: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=200&h=200',
    category: 'Local Security',
    followers: 1490,
    followed: false,
    statusUpdate: '💡 Security tips for hot weather: Check your apartment AC electrical mains for any current overload triggers and report sparks immediately!'
  }
];

export default function PagesFollowing() {
  const [localPages, setLocalPages] = useState<LocalPage[]>(INITIAL_PAGES);
  const [activeSegment, setActiveSegment] = useState<'pages' | 'emergency'>('pages');
  const [emergencyAlertText, setEmergencyAlertText] = useState('');
  const [showAlertStatus, setShowAlertStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFollowToggle = (id: string) => {
    setLocalPages(
      localPages.map((page) => {
        if (page.id === id) {
          const action = !page.followed;
          return {
            ...page,
            followed: action,
            followers: action ? page.followers + 1 : page.followers - 1
          };
        }
        return page;
      })
    );
  };

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyAlertText.trim()) return;
    setShowAlertStatus('Your civic ping has been broadcasted to authorities under verification standards.');
    setEmergencyAlertText('');
    setTimeout(() => {
      setShowAlertStatus('');
    }, 4000);
  };

  const getFilteredPages = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return localPages;
    return localPages.filter((page) => 
      page.name.toLowerCase().includes(q) ||
      page.handle.toLowerCase().includes(q) ||
      page.category.toLowerCase().includes(q) ||
      page.statusUpdate.toLowerCase().includes(q)
    );
  };

  return (
    <div id="pages-following-wrapper" className="space-y-4 max-w-2xl mx-auto">
      
      {/* Visual Header */}
      <div id="pages-top-banner" className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 space-y-1.5 text-center sm:text-left">
          <span className="text-[10px] bg-indigo-550/20 text-indigo-300 font-extrabold uppercase px-2.5 py-1 rounded-full border border-indigo-500/10">
            Society Circle
          </span>
          <h2 className="text-lg font-bold">Local Channels & Directories</h2>
          <p className="text-xs text-slate-300 max-w-md">
            Follow official authority notice boards and local community groups supporting verified city information.
          </p>
        </div>
      </div>

      {/* Segment Selector Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveSegment('pages')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSegment === 'pages' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-950'
          }`}
        >
          Community Pages ({localPages.length})
        </button>
        <button
          onClick={() => setActiveSegment('emergency')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSegment === 'emergency' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-500'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Emergency Contacts
        </button>
      </div>

      {activeSegment === 'pages' ? (
        <div id="pages-list" className="space-y-4">

          {/* Level 2: Channels & Directory Search */}
          <div id="pages-search-container" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, official desks, sports clubs, or notices..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all shadow-3xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {getFilteredPages().length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-100 font-bold text-xs">
              No matching community pages or channels found for "{searchQuery}".
            </div>
          ) : (
            getFilteredPages().map((page) => (
            <div
              key={page.id}
              id={`local-channel-${page.id}`}
              className="bg-white rounded-3xl p-4.5 border border-slate-150 shadow-sm hover:shadow-md transition-all space-y-3.5"
            >
              {/* Header Details */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                    <img
                      src={page.avatar}
                      alt={page.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {page.name}
                      {page.isAuthority && (
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded-full" title="Official Authority Notice Board">
                          IMC GOVT
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">@{page.handle} • {page.followers.toLocaleString()} local followers</p>
                  </div>
                </div>

                <button
                  onClick={() => handleFollowToggle(page.id)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    page.followed
                      ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm active:scale-95'
                  }`}
                >
                  {page.followed ? 'Following ✓' : '+ Follow'}
                </button>
              </div>

              {/* Status Notice Panel */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" /> Latest Announcement
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  "{page.statusUpdate}"
                </p>
              </div>
            </div>
          )))}

        </div>
      ) : (
        /* Emergency Help Hotlines Section */
        <div id="local-safety-directory" className="space-y-4">
          
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-2">
            <h3 className="text-xs font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              ⚠️ Immediate Resident Support (Indore City)
            </h3>
            <p className="text-xs text-red-700 leading-normal font-medium">
              For active disasters, pipe bursts, high-lines fire shorting, and municipal medical evacuation:
            </p>
            
            {/* Helpline Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a href="tel:100" className="bg-white p-2.5 rounded-lg border border-red-100 flex items-center justify-between hover:bg-red-50 transition-colors">
                <span className="text-[10.5px] font-bold text-slate-800 font-sans">State Police Control</span>
                <span className="text-xs font-black text-red-600 flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 100</span>
              </a>
              <a href="tel:101" className="bg-white p-2.5 rounded-lg border border-red-100 flex items-center justify-between hover:bg-red-50 transition-colors">
                <span className="text-[10.5px] font-bold text-slate-800 font-sans">Fire & Flame Control</span>
                <span className="text-xs font-black text-red-600 flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 101</span>
              </a>
              <a href="tel:108" className="bg-white p-2.5 rounded-lg border border-red-500/10 flex items-center justify-between hover:bg-red-50 transition-colors">
                <span className="text-[10.5px] font-bold text-slate-800 font-sans">Ambulance Services</span>
                <span className="text-xs font-black text-red-600 flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 108</span>
              </a>
              <a href="tel:18002331311" className="bg-white p-2.5 rounded-lg border border-red-550/10 flex items-center justify-between hover:bg-red-50 transition-colors">
                <span className="text-[10.5px] font-bold text-slate-800 font-sans">IMC Water Supply Helpline</span>
                <span className="text-xs font-black text-red-600 flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 1800...</span>
              </a>
            </div>
          </div>

          {/* Quick Alert Form Trigger */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" /> Ping Neighborhood Safety Team
            </h3>
            <p className="text-xs text-slate-500">
              Spotted a fallen high-voltage electrical pole or a major water pipe rupture in the coordinates? Broadcast it immediately.
            </p>

            <form onSubmit={handleSendAlert} className="space-y-2">
              <textarea
                value={emergencyAlertText}
                onChange={(e) => setEmergencyAlertText(e.target.value)}
                placeholder="Describe critical hazard, precise crossroads and landmark info..."
                className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-hidden focus:border-red-400 h-16 resize-none placeholder:text-slate-400"
                maxLength={200}
              />
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.99] transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Broadcast Verification Ping
              </button>
            </form>

            <AnimatePresence>
              {showAlertStatus && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100"
                >
                  ✓ {showAlertStatus}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
}
