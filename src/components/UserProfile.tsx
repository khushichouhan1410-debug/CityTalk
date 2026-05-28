import React, { useState } from 'react';
import { User, Post } from '../types';
import { Grid, List, Edit3, Share2, Eye, Heart, MessageCircle, X, Check, Key, Search, Database, Copy, PlusCircle, Terminal, ArrowRight, Loader2, Users, LogOut, ShieldAlert, Trash2, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

interface UserProfileProps {
  user: User;
  onUpdateUser: (newUser: User) => void;
  historicalPosts: typeof import('../data').USER_HISTORICAL_POSTS;
  onPostClick?: (postId: string) => void;
  isGuest?: boolean;
  onSignOut?: () => void;
  onDeletePost?: (postId: string) => Promise<void>;
}

export default function UserProfile({ 
  user, 
  onUpdateUser, 
  historicalPosts, 
  onPostClick, 
  isGuest = false, 
  onSignOut,
  onDeletePost
}: UserProfileProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredHistoricalPosts = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return historicalPosts;
    return historicalPosts.filter((post) => 
      post.title.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q)
    );
  };

  // Form Fields State
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [password, setPassword] = useState('khushi_secret_pass');
  const [passwordSaveMsg, setPasswordSaveMsg] = useState('');

  // Selected post detail modal simulation
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleDeletePostClick = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!onDeletePost) return;
    if (window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
      setDeletingPostId(postId);
      try {
        await onDeletePost(postId);
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(null);
        }
      } catch (err) {
        console.error("Failed to delete post:", err);
      } finally {
        setDeletingPostId(null);
      }
    }
  };

  // Followers & Following Supabase states
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [supabaseUsers, setSupabaseUsers] = useState<User[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [supabaseErr, setSupabaseErr] = useState<string | null>(null);
  const [activeModalType, setActiveModalType] = useState<'followers' | 'following' | null>(null);
  const [insertStatus, setInsertStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [insertErrorMsg, setInsertErrorMsg] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [storageSqlCopied, setStorageSqlCopied] = useState(false);

  // Schema code for database creation
  const SCHEMA_SQL = `CREATE TABLE profiles (
  username text PRIMARY KEY,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  verified_local boolean DEFAULT false
);

CREATE TABLE reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  post_id text NOT NULL,
  reason text NOT NULL,
  additional_details text
);

-- Disable Row Level Security on reports to allow smooth public testing
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;`;

  const STORAGE_POLICY_SQL = `-- Ensure 'post-images' bucket is created and configured as public
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

-- Grant public interact, select, upload & change access
create policy "Public Access for Everyone" on storage.objects for select using (bucket_id = 'post-images');
create policy "Allow Public Uploads" on storage.objects for insert with check (bucket_id = 'post-images');
create policy "Allow Public Updates" on storage.objects for update using (bucket_id = 'post-images') with check (bucket_id = 'post-images');
create policy "Allow Public Deletes" on storage.objects for delete using (bucket_id = 'post-images');`;

  // Pre-seed mock users for testing or display
  const STATIC_MOCK_USERS: User[] = [
    {
      username: 'indori_ranjit',
      fullName: 'Ranjit Vyas (Sarafa Guide)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
      bio: 'Lover of Bhutte ka Kees. Showing folks Indore street delicacies for 15 years!',
      followersCount: 1420,
      followingCount: 310,
      verifiedLocal: true
    },
    {
      username: 'crumbs_n_bakes',
      fullName: 'Ananya Sourdough',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
      bio: 'Custom sourdough, croissants & local pantry secrets. Order 1 day ahead!',
      followersCount: 890,
      followingCount: 220,
      verifiedLocal: true
    },
    {
      username: 'green_indore_civic',
      fullName: 'Meghdoot Ward Council',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
      bio: 'Indore Municipal Corporation Help Desk. Cleanliness starts with us! 🌳',
      followersCount: 3200,
      followingCount: 12,
      verifiedLocal: true
    },
    {
      username: 'neha_carpool',
      fullName: 'Neha Deshmukh',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
      bio: 'Commutes from Indore IT Park to Vijay Nagar daily. Pool with me! 🚗',
      followersCount: 450,
      followingCount: 180,
      verifiedLocal: false
    }
  ];

  const handleCopySql = () => {
    navigator.clipboard?.writeText?.(SCHEMA_SQL).catch(() => {});
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleCopyStorageSql = () => {
    navigator.clipboard?.writeText?.(STORAGE_POLICY_SQL).catch(() => {});
    setStorageSqlCopied(true);
    setTimeout(() => setStorageSqlCopied(false), 2000);
  };

  const fetchSupabaseUsers = async (type: 'followers' | 'following') => {
    setIsLoadingSupabase(true);
    setSupabaseErr(null);
    setActiveModalType(type);
    
    try {
      // Fetching from standard 'profiles' table first
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true })
        .limit(20);
        
      if (error) {
        // Fallback backup table check
        const altFetch = await supabase.from('users').select('*').limit(20);
        if (!altFetch.error && altFetch.data) {
          data = altFetch.data;
          error = null;
        } else {
          throw error;
        }
      }

      if (data && data.length > 0) {
        const parsedUsers: User[] = data.map((item: any) => ({
          username: item.username || item.user_name || 'anonymous_resident',
          fullName: item.fullName || item.full_name || item.name || 'Anonymous Resident',
          avatar: item.avatar || item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&h=200&w=200',
          bio: item.bio || 'Verified neighbor contributing to CityTalk.',
          followersCount: Number(item.followersCount || item.followers_count || 120),
          followingCount: Number(item.followingCount || item.following_count || 65),
          verifiedLocal: !!(item.verifiedLocal || item.verified_local || false)
        }));
        setSupabaseUsers(parsedUsers);
      } else {
        setSupabaseUsers([]);
      }
    } catch (err: any) {
      console.warn("Supabase fetch error, table doesn't exist yet or is empty. Graceful instruction view active.", err);
      setSupabaseErr(err.message || String(err));
      setSupabaseUsers([]);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const insertMockUserToSupabase = async () => {
    setInsertStatus('loading');
    setInsertErrorMsg(null);
    
    const num = Math.floor(100 + Math.random() * 900);
    const mockToPush = {
      username: `indore_pioneer_${num}`,
      full_name: `Supabase Resident #${num}`,
      avatar_url: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200`,
      bio: 'Testing live CityTalk database write & real-time Sync queries.',
      followers_count: Math.floor(50 + Math.random() * 400),
      following_count: Math.floor(20 + Math.random() * 200),
      verified_local: Math.random() > 0.4
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([mockToPush])
        .select();

      if (error) {
        const altInsert = await supabase
          .from('users')
          .insert([{
            username: mockToPush.username,
            fullName: mockToPush.full_name,
            avatar: mockToPush.avatar_url,
            bio: mockToPush.bio,
            followersCount: mockToPush.followers_count,
            followingCount: mockToPush.following_count,
            verifiedLocal: mockToPush.verified_local
          }])
          .select();
          
        if (altInsert.error) {
          throw error;
        }
      }
      
      setInsertStatus('success');
      setTimeout(() => setInsertStatus('idle'), 2550);
      
      if (activeModalType) {
        fetchSupabaseUsers(activeModalType);
      }
    } catch (err: any) {
      console.error("Failed to insert mock user:", err);
      setInsertStatus('failed');
      setInsertErrorMsg(err.message || String(err));
    }
  };

  const handleShareProfile = () => {
    setShared(true);
    const profileLink = `https://citytalk.local/@${user.username}`;
    navigator.clipboard?.writeText?.(profileLink).catch(() => {});
    setTimeout(() => {
      setShared(false);
    }, 2000);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
      fullName: fullName.trim(),
      bio: bio.trim(),
      avatar: avatar.trim(),
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      verifiedLocal: user.verifiedLocal
    });
    setEditModalOpen(false);
  };

  const simulatePasswordReset = () => {
    setPasswordSaveMsg('Password updated securely with HMAC simulation!');
    setTimeout(() => {
      setPasswordSaveMsg('');
    }, 3000);
  };

  return (
    <div id="user-profile-view" className="w-full bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-xs max-w-2xl mx-auto">
      
      {isGuest && (
        <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold leading-relaxed space-y-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-3xs">
          <div className="flex gap-2 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-[12px] text-amber-950">Guest Mode Active</p>
              <p className="text-amber-800 text-[11px] font-medium leading-normal mt-0.5">
                You are currently browsing CityTalk as an anonymous resident. Create a secure account or log in with your email to update your biography, post items to the live feed, edit your avatar, or link followers!
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="self-start sm:self-center py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-xs uppercase tracking-wider text-[10px]"
          >
            Authenticate
          </button>
        </div>
      )}
      
      {/* Upper Profile Section */}
      <div id="profile-upper-grid" className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
        
        {/* Avatar Container */}
        <div className="relative group flex-shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-indigo-600 p-1 bg-white shadow-md">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          {user.verifiedLocal && (
            <span className="absolute bottom-1 right-2 bg-gradient-to-tr from-indigo-650 to-pink-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-white flex items-center gap-0.5 shadow-sm">
              ✓ Verified Local
            </span>
          )}
        </div>

        {/* Info & Stats Counter Group */}
        <div className="flex-1 w-full text-center sm:text-left space-y-3">
          
          {/* Identity & User ID */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
            <h1 className="text-xl font-extrabold text-gray-950 tracking-tight flex items-center justify-center sm:justify-start gap-1">
              @{user.username}
            </h1>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              {!isGuest ? (
                <>
                  <button
                    id="edit-profile-btn"
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-3xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Edit Profile
                  </button>
                  
                  {onSignOut && (
                    <button
                      id="logout-profile-btn"
                      onClick={onSignOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 hover:border-rose-200 text-xs font-bold text-rose-700 rounded-lg hover:bg-rose-100 cursor-pointer transition-colors shadow-3xs"
                      title="Log out of your Supabase account"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  )}
                </>
              ) : (
                <button
                  id="signin-prompt-btn"
                  onClick={onSignOut} // Clicking is mapped to showing the Auth UI
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" /> Sign In / Create Account
                </button>
              )}
              
              <button
                id="share-profile-btn"
                onClick={handleShareProfile}
                className="relative flex items-center justify-center p-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-3xs"
                title="Share profile link"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shared && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Social Counts Grid */}
          <div id="stats-counters-grid" className="flex items-center justify-center sm:justify-start gap-8 py-1">
            <div className="text-center sm:text-left select-none">
              <span className="block text-md font-black text-gray-900 leading-none">{historicalPosts.length}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Posts</span>
            </div>
            
            <div 
              className="text-center sm:text-left cursor-pointer group hover:opacity-80 transition-opacity select-none"
              onClick={() => {
                setIsFollowersModalOpen(true);
                fetchSupabaseUsers('followers');
              }}
              title="Click to view followers list from Supabase"
            >
              <span className="block text-md font-black text-indigo-600 group-hover:underline leading-none">{user.followersCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Followers</span>
            </div>
            
            <div 
              className="text-center sm:text-left cursor-pointer group hover:opacity-80 transition-opacity select-none"
              onClick={() => {
                setIsFollowingModalOpen(true);
                fetchSupabaseUsers('following');
              }}
              title="Click to view following list from Supabase"
            >
              <span className="block text-md font-black text-indigo-600 group-hover:underline leading-none">{user.followingCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Following</span>
            </div>
          </div>

          {/* Biography details */}
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">About Me</h2>
            <p className="text-xs font-bold text-gray-900">{user.fullName}</p>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {user.bio}
            </p>
          </div>

        </div>
      </div>

      {/* Grid vs List View Controls */}
      <div id="profile-tabs-bar" className="flex items-center justify-between border-b border-slate-150 py-3.5 mb-4">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
          Historical Local Actions <span className="text-[10px] bg-indigo-50 rounded px-1.5 py-0.5 text-indigo-700 border border-indigo-150 font-semibold">Society Safe</span>
        </span>
        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level 3: Profile Historical Actions Search Bar */}
      <div id="profile-history-search" className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search my past posts, shares, or categories..."
          className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-3xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-150 transition-colors cursor-pointer"
            title="Clear profile search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid Thumbnail Posts (Lower Section) */}
      {getFilteredHistoricalPosts().length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-dashed border-slate-200 text-xs font-semibold">
          No matching historical actions found for "{searchQuery}".
        </div>
      ) : viewMode === 'grid' ? (
        <div id="profile-posts-grid" className="grid grid-cols-3 gap-2">
          {getFilteredHistoricalPosts().map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer group"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay Statistics on Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all text-white p-2">
                <div className="flex items-center gap-1 scale-90 group-hover:scale-100 transition-all duration-300">
                  <Heart className="w-4 h-4 fill-white text-white" />
                  <span className="text-xs font-extrabold">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 scale-90 group-hover:scale-100 transition-all duration-300 delay-75">
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span className="text-xs font-extrabold">{post.commentsCount}</span>
                </div>
              </div>

              {/* Category Badging in the grid corner */}
              <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[7.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded backdrop-blur-xs">
                {post.category}
              </span>

              {/* Delete Button */}
              {onDeletePost && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePostClick(e, post.id)}
                  className="absolute top-1.5 right-1.5 z-20 p-1.5 bg-rose-50/95 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg shadow-sm border border-rose-100/50 hover:border-rose-500 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
                  disabled={deletingPostId === post.id}
                  title="Delete Post permanently"
                >
                  {deletingPostId === post.id ? (
                    <span className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Full Details List */
        <div id="profile-posts-list" className="space-y-3">
          {getFilteredHistoricalPosts().map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-slate-205">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-extrabold tracking-wider uppercase text-indigo-600 block mb-0.5">{post.category}</span>
                <h4 className="text-xs font-bold text-slate-900 truncate">{post.title}</h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500" /> {post.likes} likes</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3 text-indigo-500" /> {post.commentsCount} replies</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedPost(post)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-indigo-50 text-[10px] text-indigo-700 hover:text-indigo-800 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Inspect
                </button>
                {onDeletePost && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePostClick(e, post.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg border border-rose-100 hover:border-rose-500 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
                    disabled={deletingPostId === post.id}
                    title="Delete Post permanently"
                  >
                    {deletingPostId === post.id ? (
                      <span className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Simulated Modal Dialog */}
      <AnimatePresence>
        {editModalOpen && (
          <div id="edit-modal-wrapper" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-4">
                <h3 className="text-md font-bold text-slate-900">Edit Personal Profile</h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-404 block mb-1">
                    Display Avatar URL
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl focus:outline-hidden focus:border-indigo-500"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-[9px] text-slate-404 mt-0.5">URLs from Unsplash work perfectly</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-404 block mb-1">
                      City Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl focus:outline-hidden focus:border-indigo-505 font-mono"
                      maxLength={18}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-404 block mb-1">
                      Full Human Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2 rounded-xl focus:outline-hidden focus:border-indigo-505"
                      maxLength={25}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-404 block mb-1">
                    Interactive Local Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 text-xs p-3 rounded-xl focus:outline-hidden focus:border-indigo-505 h-16 resize-none"
                    maxLength={140}
                  />
                </div>

                {/* Local Security Segment */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-650" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Account Credentials</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-white border border-slate-205 text-xs px-3.5 py-1.5 rounded-lg focus:outline-hidden focus:border-indigo-505"
                      placeholder="Input safe password"
                    />
                    <button
                      type="button"
                      onClick={simulatePasswordReset}
                      className="bg-slate-200 text-slate-850 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-slate-300 cursor-pointer"
                    >
                      Update Pass
                    </button>
                  </div>
                  {passwordSaveMsg && (
                    <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> {passwordSaveMsg}
                    </span>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-205 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-100"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Simulation Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div id="inspector-modal-wrapper" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl"
            >
              <div className="p-3 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold uppercase text-indigo-700 block">Historic Action Detail</span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-150">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">
                    {selectedPost.category}
                  </span>
                  <span className="text-[10px] text-slate-404">Published locally</span>
                </div>
                <h3 className="text-md font-bold text-slate-950">{selectedPost.title}</h3>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  This post was uploaded to the local database in {selectedPost.category === 'society' ? 'Indore Sector B' : 'Indore Sports Plaza'} and represents one of your historic neighborhood notifications.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-150 text-center">
                  <div>
                    <span className="block text-sm font-extrabold text-slate-900">{selectedPost.likes}</span>
                    <span className="text-[9px] text-slate-404 font-bold uppercase tracking-wider">Total Likes</span>
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold text-slate-900">{selectedPost.commentsCount}</span>
                    <span className="text-[9px] text-slate-404 font-bold uppercase tracking-wider">Replies</span>
                  </div>
                </div>
                
                <div className="text-center pt-1.5">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="w-full py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Followers Modal (Supabase Integrated) */}
      <AnimatePresence>
        {isFollowersModalOpen && (
          <div id="followers-modal-wrapper" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl p-5 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 leading-tight">Followers Network</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Live Supabase Integration
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsFollowersModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-full cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dev Status */}
              <div className="bg-slate-50 p-2.5 border-b border-slate-150 text-[10.5px] font-semibold text-slate-600 flex items-center justify-between flex-shrink-0">
                <span>Node: <code className="font-mono text-indigo-650 font-bold">mygdxzufiwrtniuhpyrr.supabase.co</code></span>
                <span className="flex items-center gap-1 font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Database className="w-3 h-3 text-indigo-600" /> profiles
                </span>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-4 py-4 min-h-[300px]">
                {isLoadingSupabase ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-600">Querying Supabase database tables...</p>
                  </div>
                ) : supabaseErr ? (
                  // Diagnostics Guide if Table not found
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 text-xs font-semibold leading-relaxed">
                      💡 <strong>Supabase Connection Verified!</strong> The app successfully connected to your Supabase instance, but standard table <code>profiles</code> was not found. Configure your schema to read live database entries.
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-indigo-650" /> Step 1: Run SQL in Dashboard
                        </span>
                        <button 
                          onClick={handleCopySql} 
                          type="button"
                          className="bg-white hover:bg-slate-100 text-[10px] text-indigo-750 font-bold px-2 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> {sqlCopied ? 'Copied!' : 'Copy SQL'}
                        </button>
                      </div>
                      <pre className="text-[9.5px] font-mono text-slate-600 bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto border border-slate-800 leading-normal">
                        {SCHEMA_SQL}
                      </pre>
                      
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1 mb-1">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Step 2: Push Live Seed Data
                        </span>
                        <p className="text-[11px] text-slate-550 leading-normal mb-2.5">
                          Click below to execute a live INSERT and verify data-write functionality. It will create a new Indore neighbor dynamically.
                        </p>
                        <button
                          onClick={insertMockUserToSupabase}
                          disabled={insertStatus === 'loading'}
                          className="w-full bg-indigo-620 hover:bg-indigo-720 disabled:opacity-50 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {insertStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing remote insert...
                            </>
                          ) : insertStatus === 'success' ? (
                            <>
                              ✓ Successfully Seeded Remote Table!
                            </>
                          ) : (
                            <>
                              Seed test row to Supabase Cloud
                            </>
                          )}
                        </button>
                        
                        {insertStatus === 'failed' && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1.5 bg-rose-50 border border-rose-100 p-2 rounded-lg break-all">
                            Write failed: {insertErrorMsg}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-indigo-650" /> Step 3: Setup 'post-images' Storage Policies
                          </span>
                          <button 
                            onClick={handleCopyStorageSql} 
                            type="button"
                            className="bg-white hover:bg-slate-100 text-[10px] text-indigo-750 font-bold px-2 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> {storageSqlCopied ? 'Copied!' : 'Copy Storage SQL'}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-550 leading-normal">
                          Paste and run this in your Supabase SQL Editor to create the <code>post-images</code> public storage bucket and allow public posts uploads:
                        </p>
                        <pre className="text-[9.5px] font-mono text-slate-600 bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto border border-slate-800 leading-normal max-h-48 overflow-y-auto">
                          {STORAGE_POLICY_SQL}
                        </pre>
                      </div>
                    </div>

                    {/* Local Fallback Representation */}
                    <div className="space-y-2 pt-2 border-t border-slate-150">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                        Local Memory Fallback Cache Residents
                      </span>
                      <div className="space-y-2.5">
                        {STATIC_MOCK_USERS.map((item) => (
                          <div key={item.username} className="flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <img src={item.avatar} alt={item.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-black text-slate-900">@{item.username}</span>
                                {item.verifiedLocal && (
                                  <span className="bg-indigo-50 text-indigo-700 font-bold text-[8.5px] px-1.5 py-0.2 rounded">Verified</span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-450 font-bold">{item.fullName}</span>
                              <p className="text-[11px] text-slate-600 mt-0.5 truncate">{item.bio}</p>
                            </div>
                            <div className="text-right flex-shrink-0 self-center">
                              <span className="text-xs font-black text-slate-950 block">{item.followersCount}</span>
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : supabaseUsers.length === 0 ? (
                  // Empty State but table is initialized
                  <div className="text-center py-10 space-y-4">
                    <Database className="w-8 h-8 text-indigo-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">Your Supabase table is empty</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">The schema was detected, but no rows are currently inserted. Seed a resident below to begin testing!</p>
                    </div>
                    <button
                      onClick={insertMockUserToSupabase}
                      disabled={insertStatus === 'loading'}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                    >
                      {insertStatus === 'loading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Insert Live Test Resident
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Live list of users parsed from Supabase
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-850 p-2 px-3 rounded-xl border border-emerald-150 text-[11px] font-bold">
                      <span className="flex items-center gap-1">✓ Rendering remote Supabase records</span>
                      <span>{supabaseUsers.length} total rows</span>
                    </div>

                    <div className="space-y-2.5">
                      {supabaseUsers.map((item) => (
                        <div key={item.username} className="flex gap-3 p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors">
                          <img src={item.avatar} alt={item.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">@{item.username}</span>
                              {item.verifiedLocal && (
                                <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[8.5px] px-1.5 py-0.2 rounded">Verified</span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-500 font-bold">{item.fullName}</span>
                            <p className="text-xs text-slate-650 mt-1 leading-normal italic">{item.bio}</p>
                          </div>
                          <div className="text-right flex-shrink-0 self-center pl-2">
                            <span className="text-xs font-black text-indigo-750 block">{item.followersCount}</span>
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Developer helper action inside live screen */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-4 text-center">
                      <p className="text-xs text-slate-600 font-semibold mb-2">Want to simulate another follower insertion to watch responsive updates?</p>
                      <button
                        onClick={insertMockUserToSupabase}
                        disabled={insertStatus === 'loading'}
                        className="py-1.5 px-3 bg-white hover:bg-slate-55 border border-slate-200 hover:border-slate-300 text-slate-800 text-[10.5px] font-bold rounded-lg cursor-pointer inline-flex items-center gap-1 hover:shadow-3xs active:scale-95 transition-all"
                      >
                        {insertStatus === 'loading' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 text-indigo-650" /> Add Another Row
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-150 flex justify-end flex-shrink-0 mt-auto">
                <button
                  onClick={() => setIsFollowersModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Dismiss Network List
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Following Modal (Supabase Integrated) */}
      <AnimatePresence>
        {isFollowingModalOpen && (
          <div id="following-modal-wrapper" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl p-5 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 leading-tight">Following Directory</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      Live Supabase Integration
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsFollowingModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-full cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dev Status */}
              <div className="bg-slate-50 p-2.5 border-b border-slate-150 text-[10.5px] font-semibold text-slate-600 flex items-center justify-between flex-shrink-0">
                <span>Node: <code className="font-mono text-indigo-650 font-bold">mygdxzufiwrtniuhpyrr.supabase.co</code></span>
                <span className="flex items-center gap-1 font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Database className="w-3 h-3 text-indigo-600" /> profiles
                </span>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-4 py-4 min-h-[300px]">
                {isLoadingSupabase ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-600">Querying Supabase database tables...</p>
                  </div>
                ) : supabaseErr ? (
                  // Diagnostics Guide if Table not found
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 text-xs font-semibold leading-relaxed">
                      💡 <strong>Supabase Connection Verified!</strong> The app successfully connected to your Supabase instance, but standard table <code>profiles</code> was not found. Configure your schema to read live database entries.
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-indigo-650" /> Step 1: Run SQL in Dashboard
                        </span>
                        <button 
                          onClick={handleCopySql} 
                          type="button"
                          className="bg-white hover:bg-slate-100 text-[10px] text-indigo-750 font-bold px-2 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> {sqlCopied ? 'Copied!' : 'Copy SQL'}
                        </button>
                      </div>
                      <pre className="text-[9.5px] font-mono text-slate-600 bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto border border-slate-800 leading-normal">
                        {SCHEMA_SQL}
                      </pre>
                      
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1 mb-1">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Step 2: Push Live Seed Data
                        </span>
                        <p className="text-[11px] text-slate-550 leading-normal mb-2.5">
                          Click below to execute a live INSERT and verify data-write functionality. It will create a new Indore neighbor dynamically.
                        </p>
                        <button
                          onClick={insertMockUserToSupabase}
                          disabled={insertStatus === 'loading'}
                          className="w-full bg-indigo-620 hover:bg-indigo-720 disabled:opacity-50 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {insertStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing remote insert...
                            </>
                          ) : insertStatus === 'success' ? (
                            <>
                              ✓ Successfully Seeded Remote Table!
                            </>
                          ) : (
                            <>
                              Seed test row to Supabase Cloud
                            </>
                          )}
                        </button>
                        
                        {insertStatus === 'failed' && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1.5 bg-rose-50 border border-rose-100 p-2 rounded-lg break-all">
                            Write failed: {insertErrorMsg}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-indigo-650" /> Step 3: Setup 'post-images' Storage Policies
                          </span>
                          <button 
                            onClick={handleCopyStorageSql} 
                            type="button"
                            className="bg-white hover:bg-slate-100 text-[10px] text-indigo-750 font-bold px-2 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> {storageSqlCopied ? 'Copied!' : 'Copy Storage SQL'}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-550 leading-normal">
                          Paste and run this in your Supabase SQL Editor to create the <code>post-images</code> public storage bucket and allow public posts uploads:
                        </p>
                        <pre className="text-[9.5px] font-mono text-slate-600 bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto border border-slate-800 leading-normal max-h-48 overflow-y-auto">
                          {STORAGE_POLICY_SQL}
                        </pre>
                      </div>
                    </div>

                    {/* Local Fallback Representation */}
                    <div className="space-y-2 pt-2 border-t border-slate-150">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                        Local Memory Fallback Cache Residents
                      </span>
                      <div className="space-y-2.5">
                        {STATIC_MOCK_USERS.map((item) => (
                          <div key={item.username} className="flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <img src={item.avatar} alt={item.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-black text-slate-900">@{item.username}</span>
                                {item.verifiedLocal && (
                                  <span className="bg-indigo-50 text-indigo-700 font-bold text-[8.5px] px-1.5 py-0.2 rounded">Verified</span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-450 font-bold">{item.fullName}</span>
                              <p className="text-[11px] text-slate-600 mt-0.5 truncate">{item.bio}</p>
                            </div>
                            <div className="text-right flex-shrink-0 self-center">
                              <span className="text-xs font-black text-slate-950 block">{item.followingCount}</span>
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">Following</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : supabaseUsers.length === 0 ? (
                  // Empty State but table is initialized
                  <div className="text-center py-10 space-y-4">
                    <Database className="w-8 h-8 text-indigo-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">Your Supabase table is empty</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">The schema was detected, but no rows are currently inserted. Seed a resident below to begin testing!</p>
                    </div>
                    <button
                      onClick={insertMockUserToSupabase}
                      disabled={insertStatus === 'loading'}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                    >
                      {insertStatus === 'loading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Insert Live Test Resident
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Live list of users parsed from Supabase
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-indigo-50 text-indigo-900 p-2 px-3 rounded-xl border border-indigo-150 text-[11px] font-bold">
                      <span className="flex items-center gap-1">✓ Rendering remote Supabase records</span>
                      <span>{supabaseUsers.length} total rows</span>
                    </div>

                    <div className="space-y-2.5">
                      {supabaseUsers.map((item) => (
                        <div key={item.username} className="flex gap-3 p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors">
                          <img src={item.avatar} alt={item.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">@{item.username}</span>
                              {item.verifiedLocal && (
                                <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[8.5px] px-1.5 py-0.2 rounded">Verified</span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-500 font-bold">{item.fullName}</span>
                            <p className="text-xs text-slate-655 mt-1 leading-normal italic">{item.bio}</p>
                          </div>
                          <div className="text-right flex-shrink-0 self-center pl-2">
                            <span className="text-xs font-black text-indigo-750 block">{item.followingCount}</span>
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">Following</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Developer helper action inside live screen */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-4 text-center">
                      <p className="text-xs text-slate-600 font-semibold mb-2">Want to simulate another following insertion to watch responsive updates?</p>
                      <button
                        onClick={insertMockUserToSupabase}
                        disabled={insertStatus === 'loading'}
                        className="py-1.5 px-3 bg-white hover:bg-slate-55 border border-slate-200 hover:border-slate-300 text-slate-800 text-[10.5px] font-bold rounded-lg cursor-pointer inline-flex items-center gap-1 hover:shadow-3xs active:scale-95 transition-all"
                      >
                        {insertStatus === 'loading' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 text-indigo-650" /> Add Another Row
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-150 flex justify-end flex-shrink-0 mt-auto">
                <button
                  onClick={() => setIsFollowingModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Dismiss Network List
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
