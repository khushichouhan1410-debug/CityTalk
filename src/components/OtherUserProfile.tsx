import React, { useState } from 'react';
import { User, Post } from '../types';
import { Grid, ArrowLeft, Heart, MessageCircle, X, Check, UserPlus, UserMinus, MessageSquare, Send, Bell, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

interface OtherUserProfileProps {
  username: string;
  allPosts: Post[];
  onBack: () => void;
  onSendSimulationMessage: (fromUser: { username: string; avatar: string }, text: string) => void;
}

// Map username to mock profiles
const MOCK_PROFILES_DATA: Record<string, { fullName: string; avatar: string; bio: string; followersCount: number; followingCount: number; verifiedLocal: boolean; defaultMessages: string[] }> = {
  'indori_ranjit': {
    fullName: 'Ranjit Vyas',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Badminton enthusiast 🏸 | Indore Sports Ambassador | Morning runner at Meghdoot. Let\'s make Indore healthier!',
    followersCount: 1240,
    followingCount: 450,
    verifiedLocal: true,
    defaultMessages: [
      "Hey! The badminton game is scheduled for Saturday at 7 AM. Will you be joining?",
      "Sure, I can arrange an extra racket for you. No problem!",
      "Great playing with you! We should do this every weekend."
    ]
  },
  'crumbs_n_bakes': {
    fullName: 'Ananya Sourdough',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Baker & Entrepreneur 🍰☕️ | Bringing wild yeast sourdough & French pastries to Scheme 78. Use CITYTALK20!',
    followersCount: 3890,
    followingCount: 1120,
    verifiedLocal: true,
    defaultMessages: [
      "We bake fresh every morning! The doors open at 8:00 AM.",
      "Yes! The CITYTALK20 coupon code works on our bread baskets and expressos.",
      "We are planning a gluten-free pastry class soon! Keep an eye on CityTalk for announcements."
    ]
  },
  'green_indore_civic': {
    fullName: 'Meghdoot Ward Council',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Indore Civic News & Water Logging Updates 🐳 | Non-partisan citizen action community focused on Scheme 78 infrastructure.',
    followersCount: 942,
    followingCount: 88,
    verifiedLocal: true,
    defaultMessages: [
      "Municipal team has arrived at the Sector B water logging area and cleared the major choke.",
      "Thank you for reporting this issue! Citizen support makes Indore India's cleanest city.",
      "Our ward meeting is scheduled for next Tuesday at 6 PM. Join us to raise local demands."
    ]
  },
  'neha_carpool': {
    fullName: 'Neha Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'IT Consultant @ Dewas Tech Park 🚗 | SUV driver. Safe, environmentalist, and believes sharing is caring!',
    followersCount: 345,
    followingCount: 412,
    verifiedLocal: false,
    defaultMessages: [
      "Hey! I leave at 8:45 AM from Bapat Chauraha. Do you want to join?",
      "No smoking in the car, please! We split fuel via Google Pay.",
      "See you tomorrow! I will honk once when I reach your bypass crossing."
    ]
  },
  'organic_indore': {
    fullName: 'Shyam Patidar',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Farmer 👨‍🌾 | Fresh Alphonso & Kesari mangoes delivered straight from our orchards in Khargone. Sweet and pesticide-free!',
    followersCount: 1540,
    followingCount: 231,
    verifiedLocal: true,
    defaultMessages: [
      "Hello! Our mango trucks will arrive at Sector B gate at 4 PM.",
      "Yes, we have 5kg organic crates available for only ₹600.",
      "Free organic mint bunches are waiting for all pre-orders!"
    ]
  }
};

export default function OtherUserProfile({ username, allPosts, onBack, onSendSimulationMessage }: OtherUserProfileProps) {
  const profileDetails = MOCK_PROFILES_DATA[username] || {
    fullName: username.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&h=200&w=200',
    bio: 'Active CityTalk neighbor. Let\'s connect and build a better society together!',
    followersCount: 184,
    followingCount: 92,
    verifiedLocal: false,
    defaultMessages: ["Hey neighbor! How can I help you today?", "Nice connecting with you on CityTalk!"]
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profileDetails.followersCount);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'other'; text: string; time: string }>>([
    { sender: 'other', text: `Hi there! I'm @${username}. Welcome to my profile! Feel free to message me.`, time: 'Just now' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Post Reporting States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'Malicious Content' | 'Nudity' | 'Fake News'>('Malicious Content');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    setIsSubmittingReport(true);
    setReportError(null);
    try {
      const { error } = await supabase.from('reports').insert({
        post_id: selectedPost.id,
        reason: reportReason,
        additional_details: reportDetails.trim() || null
      });

      if (error) {
        console.error("Supabase reporting error:", error);
        throw error;
      }

      // Success
      setIsReportModalOpen(false);
      setReportDetails('');
      setReportReason('Malicious Content');
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
      }, 5005);
    } catch (err: any) {
      console.error("General error reporting post:", err);
      setReportError(err.message || 'Submission failed. Please verify that the "reports" table exists.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filter posts created by this user
  const userPosts = allPosts.filter(p => p.username === username);

  // Generate auxiliary historic posts if none or just to populate
  const auxiliaryPostThumbnails = userPosts.length > 0 ? userPosts : [
    {
      id: `${username}-auto-1`,
      title: `${profileDetails.fullName}'s past local update`,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400&h=450',
      category: 'locals' as const,
      likes: 64,
      comments: []
    }
  ];

  const handleFollowToggle = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    const userText = customMsg.trim();
    // Add user message to chat
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: 'Just now' }]);
    setCustomMsg('');

    // Trigger typing simulation
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Select response based on context or random index
      const otherResponses = profileDetails.defaultMessages;
      const responseText = otherResponses[Math.floor(Math.random() * otherResponses.length)];
      
      setChatMessages(prev => [...prev, { sender: 'other', text: responseText, time: 'Just now' }]);

      // Send to the global simulation server hook as well to trigger a floating banner notification if chat is minimized!
      onSendSimulationMessage({
        username,
        avatar: profileDetails.avatar
      }, responseText);

    }, 1500);
  };

  const handleQuickPromptClick = (text: string) => {
    setCustomMsg(text);
  };

  return (
    <div id="other-user-profile-view" className="w-full max-w-2xl mx-auto space-y-4">
      {/* Top action bar with Back navigation */}
      <div className="flex items-center justify-between bg-white py-3 px-4 rounded-2xl border border-gray-100 shadow-3xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>
        <span className="text-xs font-bold font-mono text-slate-400">@{username} Profile</span>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
        {/* Decorative corner grid background blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -z-10" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Container */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-indigo-600 p-1 bg-white shadow-md">
              <img
                src={profileDetails.avatar}
                alt={profileDetails.fullName}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            {profileDetails.verifiedLocal && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full border border-white whitespace-nowrap shadow-xs">
                Verified Local
              </span>
            )}
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left space-y-3.5">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-black text-gray-950">@{username}</h2>
                <span className="text-xs font-semibold text-gray-400">({profileDetails.fullName})</span>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed max-w-md">{profileDetails.bio}</p>
            </div>

            {/* Followers, Following, Post Counts */}
            <div className="flex items-center justify-center sm:justify-start gap-8 py-2 border-y border-gray-50">
              <div className="text-center sm:text-left">
                <span className="block text-md font-black text-indigo-650 leading-none">{auxiliaryPostThumbnails.length}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Updates</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-md font-black text-gray-900 leading-none">{followerCount}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-md font-black text-gray-900 leading-none">{profileDetails.followingCount}</span>
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Following</span>
              </div>
            </div>

            {/* Action Buttons: Follow/Unfollow & Message */}
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <button
                id="follow-button-toggle"
                onClick={handleFollowToggle}
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
                  isFollowing
                    ? 'bg-gray-150 border border-gray-200 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:scale-[1.02]'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" /> Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>

              <button
                id="message-button-drawer"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-extrabold text-gray-800 hover:bg-gray-55 cursor-pointer transition-all hover:border-indigo-300"
              >
                <MessageSquare className="w-4 h-4 text-indigo-500" /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
          <Grid className="w-4 h-4 text-indigo-600" /> Local Post History
        </h3>

        {/* Thumbnail previews */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {auxiliaryPostThumbnails.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post as Post)}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-slate-100 bg-slate-50"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-indigo-50/50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">{post.category}</span>
                  <span className="text-[11px] font-bold text-gray-800 line-clamp-3 mt-1">{post.title}</span>
                </div>
              )}

              {/* Hover overlay details */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center gap-1">
                <span className="text-[11px] font-black line-clamp-2">{post.title}</span>
                <span className="text-[9px] font-semibold flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> {post.likes || 12} Likes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Interactive Dialog Detail view when clicking thumbnails */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-700">Neighborhood Post Preview</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-full border border-rose-100/60 transition-colors flex items-center justify-center cursor-pointer"
                    title="Report Post"
                    type="button"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full bg-white border border-gray-100 flex items-center justify-center cursor-pointer"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedPost.image && (
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[8.5px] font-black uppercase bg-indigo-50 text-indigo-650 px-2.5 py-1 rounded-md border border-indigo-100">
                    {selectedPost.category}
                  </span>
                  {selectedPost.tag && (
                    <span className="text-[9.5px] font-bold text-gray-500">
                      • {selectedPost.tag}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-md font-black text-gray-950 leading-snug">{selectedPost.title}</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {selectedPost.description || `This updates represents an interactive local community action item posted in MP city limits.`}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-3 px-3 py-2 bg-indigo-50/40 rounded-xl border border-indigo-50">
                  <div>
                    <span className="block text-md font-black text-gray-900 leading-none">{selectedPost.likes || 12}</span>
                    <span className="text-[8.5px] text-gray-400 font-extrabold uppercase">Post Likes</span>
                  </div>
                  <div>
                    <span className="block text-md font-black text-gray-900 leading-none">{(selectedPost.comments && selectedPost.comments.length) || 3}</span>
                    <span className="text-[8.5px] text-gray-400 font-extrabold uppercase">Replies Count</span>
                  </div>
                  {selectedPost.address && (
                    <div className="ml-auto text-right">
                      <span className="block text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{selectedPost.address}</span>
                      <span className="text-[8.5px] text-gray-400 font-extrabold uppercase">Sector</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-full py-2.5 bg-gray-950 font-bold text-white rounded-xl text-xs hover:bg-gray-800 cursor-pointer"
                >
                  Return to Profile Grid
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simulated Live Messages Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl flex flex-col h-[480px]"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={profileDetails.avatar}
                    alt={username}
                    className="w-9 h-9 rounded-full object-cover border border-indigo-400"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-black text-gray-900">@{username}</h4>
                    <span className="text-[8.5px] font-bold text-emerald-500 uppercase flex items-center gap-0.5">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Active Now
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-950 bg-white border border-gray-150 rounded-full shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-150'
                      }`}
                    >
                      {msg.text}
                      <span className={`block text-[8px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Simulate typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-405 border border-gray-100 rounded-2xl p-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-505 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-505 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-505 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions quick tap shortcuts */}
              <div className="px-3.5 py-2 border-t border-gray-100 bg-white overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
                <button
                  onClick={() => handleQuickPromptClick("Hey! Are you online?")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-gray-700 px-3 py-1.5 rounded-full font-bold transition-all flex-shrink-0"
                >
                  "Are you online?"
                </button>
                <button
                  onClick={() => handleQuickPromptClick("Can you give me more info about your latest post?")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-gray-700 px-3 py-1.5 rounded-full font-bold transition-all flex-shrink-0"
                >
                  "More post info..."
                </button>
                <button
                  onClick={() => handleQuickPromptClick("Let's connect soon!")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-gray-700 px-3 py-1.5 rounded-full font-bold transition-all flex-shrink-0"
                >
                  "Let's connect!"
                </button>
              </div>

              {/* Chat Send Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type a city message..."
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-4 py-2 bg-slate-50 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-650 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Success Toast */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-1.5 z-55 w-11/12 max-w-sm"
          >
            <span className="text-[10px] bg-white/20 p-1 rounded-full flex items-center justify-center w-5 h-5 flex-shrink-0">✓</span>
            <span className="flex-1">Thank you for reporting. Our moderation team will review this post.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Post Modal Dialog */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-slate-100 shadow-2xl p-6 relative text-left"
            >
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportError(null);
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-extrabold text-slate-950">Report Post</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Help keep our local community safe and trustworthy</p>
                </div>
              </div>

              {reportError && (
                <div className="mb-4 text-xs font-bold text-red-650 bg-rose-50 p-3 rounded-xl border border-rose-100/50">
                  ⚠️ {reportError}
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Select a Reason</label>
                  <div className="space-y-2">
                    {['Malicious Content', 'Nudity', 'Fake News'].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          reportReason === reason
                            ? 'border-indigo-600 bg-indigo-50/40 font-bold text-indigo-950'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason as any)}
                          className="w-4 h-4 text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Additional Details (Optional)</label>
                  <textarea
                    placeholder="Provide context or explanation here..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder:text-slate-400 h-20 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReportModalOpen(false);
                      setReportError(null);
                    }}
                    className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer text-center"
                    disabled={isSubmittingReport}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer text-center transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingReport ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Reporting...</span>
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
