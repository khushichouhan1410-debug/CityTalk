import { useState } from 'react';
import { Home, PlusSquare, Users, User, Bell, MapPin, ChevronDown, LogOut, Key } from 'lucide-react';
import { CITIES } from '../data';
import { User as UserType, NotificationItem } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateModal: () => void;
  selectedCity: typeof CITIES[0];
  setSelectedCity: (city: typeof CITIES[0]) => void;
  user: UserType;
  notifications: NotificationItem[];
  markNotificationsAsRead: () => void;
  isGuest?: boolean;
  onSignOut?: () => void;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  openCreateModal,
  selectedCity,
  setSelectedCity,
  user,
  notifications,
  markNotificationsAsRead,
  isGuest = false,
  onSignOut
}: NavigationProps) {
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setSelectedCity(city);
    setCityDropdownOpen(false);
  };

  const toggleNotifications = () => {
    setNotiDropdownOpen(!notiDropdownOpen);
    if (!notiDropdownOpen) {
      markNotificationsAsRead();
    }
  };

  return (
    <>
      {/* Sticky Top Bar */}
      <header id="app-top-header" className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            id="brand-logo" 
            className="flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-95"
            onClick={() => setActiveTab('feed')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
              <span className="text-white font-black text-sm">CT</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              CityTalk
            </span>
          </div>

          {/* Dynamic City Badge Dropdown */}
          <div id="city-badge-container" className="relative">
            <button
              id="city-selector-btn"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs"
            >
              <MapPin id="map-pin-icon" className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
              <span>{selectedCity.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">({selectedCity.zone})</span>
              <ChevronDown id="chevron-down-icon" className="w-3 h-3 text-slate-400" />
            </button>

            {/* City Dropdown Menu */}
            {cityDropdownOpen && (
              <div id="city-dropdown-menu" className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div id="dropdown-header" className="px-3 py-1.5 border-b border-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select City / Society</span>
                </div>
                {CITIES.map((city) => (
                  <button
                    key={city.id}
                    id={`city-select-${city.id}`}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      selectedCity.id === city.id 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                        : 'text-slate-705 hover:bg-slate-50'
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{city.zone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification & Right Icons */}
          <div id="top-bar-right-actions" className="flex items-center gap-3 relative">
            <button
              id="notifications-bell-btn"
              onClick={toggleNotifications}
              className="relative p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <Bell id="bell-icon" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span id="unread-noti-count" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-550 text-white font-black text-[9px] flex items-center justify-center rounded-full border border-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              id="avatar-top-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`w-8 h-8 rounded-full overflow-hidden border cursor-pointer hidden sm:block ${
                activeTab === 'profile' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Notification Dropdown Pane */}
            {notiDropdownOpen && (
              <div id="noti-dropdown-menu" className="absolute right-0 top-11 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-150 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <div id="noti-header" className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Local Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div id="noti-items-list" className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((noti) => (
                      <div
                        key={noti.id}
                        className={`p-3 flex gap-3 transition-colors ${!noti.read ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                      >
                        <img
                          src={noti.userAvatar}
                          alt={noti.username}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-150"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 leading-snug">
                            <span className="font-bold text-slate-900 mr-1">@{noti.username}</span>
                            {noti.message}
                          </p>
                          <span className="text-[10px] text-slate-405 mt-0.5 block">{noti.time}</span>
                        </div>
                        {noti.postId && (
                          <div className="w-8 h-8 bg-slate-100 rounded-sm flex-shrink-0 overflow-hidden border border-slate-200">
                            <div className="text-[8px] text-center text-slate-404 font-bold p-0.5 truncate">
                              {noti.postTitle}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div id="noti-footer" className="p-2 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setNotiDropdownOpen(false)}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Close Pane
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Persistent Left Sidebar / Navigation for Desktop (Screens > 640px) */}
      <aside id="desktop-sidebar" className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 px-4 z-30">
        <div id="sidebar-links-container" className="space-y-1.5">
          <button
            id="sidebar-home-btn"
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'feed' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Home Feed</span>
          </button>

          <button
            id="sidebar-create-btn"
            onClick={openCreateModal}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-slate-605 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer border-l-4 border-transparent"
          >
            <PlusSquare className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
            <span>Create Post</span>
          </button>

          <button
            id="sidebar-following-btn"
            onClick={() => setActiveTab('pages')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'pages'
                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'pages' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Pages & Following</span>
          </button>

          <button
            id="sidebar-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>User Profile</span>
          </button>
        </div>

        {/* Desktop Mini User Badge at the bottom of sidebar */}
        <div id="sidebar-user-footer" className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex flex-col gap-2.5">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover animate-fade-in"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">@{user.username}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.fullName}</p>
            </div>
            <div 
              className={`w-2 h-2 rounded-full border-2 border-white animate-pulse flex-shrink-0 ${isGuest ? 'bg-amber-500' : 'bg-green-500'}`} 
              title={isGuest ? "Browsing as Guest" : "Verified Citizen"}
            />
          </div>
          {isGuest ? (
            <button
              id="sidebar-sign-in"
              onClick={onSignOut}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Key className="w-3 h-3" /> Sign In / Register
            </button>
          ) : (
            <button
              id="sidebar-sign-out"
              onClick={onSignOut}
              className="w-full py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-150 text-slate-600 hover:text-rose-700 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3 h-3" /> Log Out
            </button>
          )}
        </div>
      </aside>

      {/* Bottom Navigation Bar for Mobile screens */}
      <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 h-15 bg-white border-t border-slate-200 flex items-center justify-around z-40 md:hidden pb-safe">
        <button
          id="mobile-nav-home"
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
            activeTab === 'feed' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Home</span>
        </button>

        <button
          id="mobile-nav-create"
          onClick={openCreateModal}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-md transition-transform active:scale-90 shadow-indigo-200">
            <PlusSquare className="w-5 h-5" />
          </div>
        </button>

        <button
          id="mobile-nav-following"
          onClick={() => setActiveTab('pages')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
            activeTab === 'pages' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Following</span>
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
            activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-505'
          }`}
        >
          <div className={`w-6 h-6 rounded-full overflow-hidden border ${
            activeTab === 'profile' ? 'border-indigo-600 ring-1 ring-indigo-100' : 'border-slate-200'
          }`}>
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[9px] font-bold mt-0.5">Profile</span>
        </button>
      </nav>
    </>
  );
}
