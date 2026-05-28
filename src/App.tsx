/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, User, Category } from './types';
import { CITIES, INITIAL_USER, INITIAL_POSTS, INITIAL_NOTIFICATIONS, USER_HISTORICAL_POSTS } from './data';
import Navigation from './components/Navigation';
import FeedFilter from './components/FeedFilter';
import PostCard from './components/PostCard';
import CreatePostModal from './components/CreatePostModal';
import UserProfile from './components/UserProfile';
import PagesFollowing from './components/PagesFollowing';
import OtherUserProfile from './components/OtherUserProfile';
import NotificationBanner, { BannerNotification } from './components/NotificationBanner';
import Auth from './components/Auth';
import { supabase } from './supabase';
import { Plus, Users, Heart, Share2, MessageCircle, MapPin, Sparkles, Navigation as NavIcon, Radio, BellRing, Play, Pause, RefreshCw, MessageSquare, Search, X, ShieldAlert, Key, Globe, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [userHistoricalPosts, setUserHistoricalPosts] = useState(USER_HISTORICAL_POSTS);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication & Session States
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authActionWarning, setAuthActionWarning] = useState<string | null>(null);

  // Custom simulation and real-time user-targeted states
  const [activeProfileUsername, setActiveProfileUsername] = useState<string | null>(null);
  const [bannerNotifs, setBannerNotifs] = useState<BannerNotification[]>([]);
  const [autoSimulate, setAutoSimulate] = useState(false);

  // Trigger a banner notification and sync to bell
  const triggerNotification = (type: 'like' | 'comment' | 'message', actorName: string, actorAvatar: string, text: string) => {
    const notifId = `banner-notif-${Date.now()}`;
    
    // Add banner toast
    setBannerNotifs(prev => [
      {
        id: notifId,
        type,
        actorName,
        actorAvatar,
        text
      },
      ...prev
    ]);

    // Set auto-dismiss timer
    setTimeout(() => {
      setBannerNotifs(prev => prev.filter(b => b.id !== notifId));
    }, 4500);

    // Sync into top-bar bell list
    const newBellNotif = {
      id: `bell-notif-${Date.now()}`,
      type: type === 'message' ? ('follow' as const) : (type as 'like' | 'comment'), 
      username: actorName,
      userAvatar: actorAvatar,
      message: type === 'message' ? `sent you a message: "${text}"` : text,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newBellNotif, ...prev]);
  };

  const MOCK_ACTORS = [
    { username: 'indori_ranjit', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200' },
    { username: 'crumbs_n_bakes', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200' },
    { username: 'neha_carpool', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200' },
    { username: 'organic_indore', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200' }
  ];

  const MOCK_INTERACTION_TEXTS = {
    like: [
      'liked your Sourdough Success post! 👍',
      'loved your Clean Indore Society post! ❤️',
      'voted for your Golden Retriever alert!'
    ],
    comment: [
      'commented: "This looks super delicious! Do you take custom pre-orders?"',
      'replied: "I am joining the cleaning effort this weekend, let\'s go team!"',
      'replied: "Is Bapat Chauraha route friendly for electric vehicles?"'
    ],
    message: [
      'Hey! Could we schedule a badminton match on our local court next Sunday?',
      'Let me know if you would like to split diesel costs for the Dewas ride!',
      'Are the mango crates still available at the gate?'
    ]
  };

  const simulateRandomInteraction = () => {
    const types: Array<'like' | 'comment' | 'message'> = ['like', 'comment', 'message'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const chosenActor = MOCK_ACTORS[Math.floor(Math.random() * MOCK_ACTORS.length)];
    const messages = MOCK_INTERACTION_TEXTS[chosenType];
    const chosenText = messages[Math.floor(Math.random() * messages.length)];
    triggerNotification(chosenType, chosenActor.username, chosenActor.avatar, chosenText);
  };

  const handleAuthComplete = (newSession: any) => {
    setSession(newSession);
    setIsGuest(false);
    if (newSession?.user) {
      const meta = newSession.user.user_metadata || {};
      const userUsername = meta.username || newSession.user.email?.split('@')[0]?.replace(/\W/g, '_') || 'citizen_user';
      const userFullName = meta.full_name || 'Verified Resident';
      const userAvatar = meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300';
      const userBio = meta.bio || 'Verified neighbor contributing to CityTalk.';

      const updatedUser = {
        username: userUsername,
        fullName: userFullName,
        avatar: userAvatar,
        bio: userBio,
        followersCount: 154,
        followingCount: 89,
        verifiedLocal: true
      };

      setUser(updatedUser);

      // Auto upsert authentication user into profiles table
      supabase.from('profiles').upsert({
        username: userUsername,
        full_name: userFullName,
        avatar_url: userAvatar,
        bio: userBio,
        verified_local: true
      }).then(({ error }) => {
        if (error) console.error("Error upserting profile on auth transition:", error);
      });
    }
  };

  // 1. Seed default posts to Supabase if database starts empty
  const seedDefaultDataToSupabase = async () => {
    try {
      console.log("Seeding default profiles to Supabase 'profiles' table...");
      const mockProfiles = [
        { username: 'indori_ranjit', full_name: 'Ranjit Vyas (Sarafa Guide)', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200', bio: 'Lover of Bhutte ka Kees. Showing folks Indore street delicacies for 15 years!', verified_local: true },
        { username: 'crumbs_n_bakes', full_name: 'Ananya Sourdough', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200', bio: 'Custom sourdough, croissants & local pantry secrets. Order 1 day ahead!', verified_local: true },
        { username: 'green_indore_civic', full_name: 'Meghdoot Ward Council', avatar_url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200&h=200', bio: 'Indore Municipal Corporation Help Desk. Cleanliness starts with us! 🌳', verified_local: true },
        { username: 'neha_carpool', full_name: 'Neha Deshmukh', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200', bio: 'Commutes from Indore IT Park to Vijay Nagar daily. Pool with me! 🚗', verified_local: false },
        { username: 'organic_indore', full_name: 'Organic Indore Farm', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200', bio: 'Fresh and pesticide-free produce straight from the Khargone orchards.', verified_local: true },
      ];
      await supabase.from('profiles').upsert(mockProfiles);

      console.log("Seeding default posts to Supabase 'posts' table...");
      const postsToInsert = INITIAL_POSTS.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        image: p.image || null,
        likes: p.likes || 0,
        address: p.address || null,
        tag: p.tag || null,
        username: p.username,
        time_elapsed: p.timeElapsed || '2 hours ago',
        is_promoted: !!p.isPromoted,
        promotion_coupon: p.promotionCoupon || null
      }));
      await supabase.from('posts').upsert(postsToInsert);

      console.log("Seeding comments to Supabase 'comments' table...");
      const commentsToInsert: any[] = [];
      INITIAL_POSTS.forEach(post => {
        post.comments.forEach(c => {
          commentsToInsert.push({
            id: c.id,
            post_id: post.id,
            username: c.username,
            user_avatar: c.userAvatar,
            text: c.text,
            created_at: c.time || '1h'
          });
        });
      });

      if (commentsToInsert.length > 0) {
        await supabase.from('comments').upsert(commentsToInsert);
      }
      console.log("Seeding completed successfully!");
    } catch (err) {
      console.error("Failed executing default mock seed logic:", err);
    }
  };

  // 2. Fetch/Synchronize feed from live Supabase Tables
  const syncFeedFromSupabase = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*');

      if (postsError) {
        console.warn("Unable to read from 'posts' table on Supabase. Operating in demo fallback state:", postsError);
        return;
      }

      // If empty table, automatically seed default postings to make active database rich on open
      if (!postsData || postsData.length === 0) {
        toastDemoMessage("Fresh database detected. Seeding community feed...");
        await seedDefaultDataToSupabase();
        const reFetch = await supabase.from('posts').select('*');
        if (reFetch.data && reFetch.data.length > 0) {
          await renderMappedPosts(reFetch.data);
        }
        return;
      }

      await renderMappedPosts(postsData);
    } catch (e) {
      console.error("General error synchronizing Supabase Feed:", e);
    }
  };

  const toastDemoMessage = (text: string) => {
    triggerNotification('like', 'CityTalk BOT 🤖', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', text);
  };

  const renderMappedPosts = async (postsList: any[]) => {
    try {
      const { data: commentsData } = await supabase.from('comments').select('*');
      const { data: profilesData } = await supabase.from('profiles').select('*');

      const profilesMap = new Map<string, any>();
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap.set(p.username, p);
        });
      }

      const commentsGroupMap = new Map<string, any[]>();
      if (commentsData) {
        commentsData.forEach(c => {
          const pId = c.post_id || c.postId || '';
          if (!commentsGroupMap.has(pId)) {
            commentsGroupMap.set(pId, []);
          }
          commentsGroupMap.get(pId)!.push({
            id: c.id,
            username: c.username || 'anonymous_resident',
            userAvatar: c.user_avatar || c.userAvatar || profilesMap.get(c.username)?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=105&h=105',
            text: c.text || c.content || '',
            time: c.created_at || c.time || '1h'
          });
        });
      }

      const mapped: Post[] = postsList.map((p: any) => {
        const pUsername = p.username || 'anonymous_resident';
        const profileInfo = profilesMap.get(pUsername);
        return {
          id: p.id,
          userId: p.user_id || p.userId || pUsername,
          username: pUsername,
          userAvatar: profileInfo?.avatar_url || p.user_avatar || p.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
          timeElapsed: p.time_elapsed || p.timeElapsed || 'Just now',
          title: p.title || 'Untitled Post',
          description: p.description || p.content || '',
          category: (p.category as Category) || 'locals',
          image: p.image || p.image_url || undefined,
          likes: Number(p.likes || 0),
          hasLiked: false, 
          hasBookmarked: false,
          comments: commentsGroupMap.get(p.id) || [],
          address: p.address || undefined,
          tag: p.tag || undefined,
          isPromoted: !!(p.is_promoted || p.isPromoted),
          promotionCoupon: p.promotion_coupon || p.promotionCoupon || undefined
        };
      });

      // Sort by newly created posts first
      mapped.sort((a, b) => b.id.localeCompare(a.id));

      setPosts(mapped);
    } catch (e) {
      console.error("Mapping posts error:", e);
    }
  };

  useEffect(() => {
    // Try to retrieve active Supabase session on startup
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        handleAuthComplete(currentSession);
      }
      setAuthLoading(false);
    }).catch((err) => {
      console.error("Supabase getSession error:", err);
      setAuthLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        handleAuthComplete(currentSession);
      } else {
        setSession(null);
        // Clear state to guest defaults
        setUser({
          username: 'guest_resident',
          fullName: 'Guest Resident',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300',
          bio: 'Browsing town talk read-only. Authentication required to interact.',
          followersCount: 0,
          followingCount: 0,
          verifiedLocal: false
        });
      }
    });

    // Sync live database posts on initial render
    syncFeedFromSupabase();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsGuest(false);
    setActiveTab('feed');
  };

  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(() => {
      simulateRandomInteraction();
    }, 18050);
    return () => clearInterval(interval);
  }, [autoSimulate]);

  // Interactive like toggle handler
  const handleLike = async (postId: string) => {
    if (isGuest) {
      setAuthActionWarning("Liking neighborhood posts is reserved for verified citizens. Authenticate your email below!");
      return;
    }

    let nextCount = 0;
    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const liked = !post.hasLiked;
          nextCount = liked ? post.likes + 1 : post.likes - 1;
          return {
            ...post,
            hasLiked: liked,
            likes: nextCount,
          };
        }
        return post;
      })
    );

    // Persist asynchronously in Supabase
    try {
      await supabase.from('posts').update({ likes: nextCount }).eq('id', postId);
    } catch (err) {
      console.error("Failed syncing like toggle to Supabase:", err);
    }
  };

  // Interactive bookmark toggle handler
  const handleBookmark = (postId: string) => {
    if (isGuest) {
      setAuthActionWarning("Bookmarking posts is reserved for verified citizens. Authenticate your email below!");
      return;
    }
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            hasBookmarked: !post.hasBookmarked,
          };
        }
        return post;
      })
    );
  };

  // Interactive comments submission handler
  const handleAddComment = async (postId: string, commentText: string) => {
    if (isGuest) {
      setAuthActionWarning("Commenting on posts is reserved for verified citizens. Authenticate your email below!");
      return;
    }
    const commentId = `comment-${Date.now()}`;
    const newComment = {
      id: commentId,
      username: user.username,
      userAvatar: user.avatar,
      text: commentText,
      time: 'Just now'
    };

    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );

    // Save to Supabase 'comments' table
    try {
      await supabase.from('comments').insert([{
        id: commentId,
        post_id: postId,
        postId: postId,
        username: user.username,
        user_avatar: user.avatar,
        text: commentText,
        created_at: 'Just now'
      }]);
    } catch (err) {
      console.error("Failed inserting comment to Supabase table:", err);
    }

    // If target post belongs to another user, spawn an artificial notification to keep prototype dynamic!
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost && targetPost.userId !== 'user-current') {
      const newNoti = {
        id: `noti-added-${Date.now()}`,
        type: 'comment' as const,
        username: user.username,
        userAvatar: user.avatar,
        message: `replied: "${commentText}" to your post "${targetPost.title}"`,
        time: 'Just now',
        postId: postId,
        postTitle: targetPost.title,
        read: false
      };
      setNotifications([newNoti, ...notifications]);
    }
  };

  // Create post handler
  const handleCreatePost = async (
    newPostData: Omit<Post, 'id' | 'userId' | 'username' | 'userAvatar' | 'timeElapsed' | 'likes' | 'comments' | 'hasLiked' | 'hasBookmarked'>,
    file?: File
  ) => {
    const postId = `post-${Date.now()}`;
    let finalImageUrl = newPostData.image || null;

    if (file) {
      try {
        const uniqueFileName = `image_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(uniqueFileName, file);

        if (uploadError) {
          console.error("Storage upload error details:", uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage.from('post-images').getPublicUrl(uniqueFileName);
        if (data && data.publicUrl) {
          finalImageUrl = data.publicUrl;
        }
      } catch (uploadErr) {
        console.error("Failed uploading image to Supabase Storage:", uploadErr);
        triggerNotification('message', 'System Help 🤖', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', 'Storage upload failed. Publishing post without image.');
      }
    }

    const freshPost: Post = {
      ...newPostData,
      id: postId,
      userId: user.username,
      username: user.username,
      userAvatar: user.avatar,
      timeElapsed: 'Just now',
      image: finalImageUrl || undefined,
      likes: 0,
      comments: [],
      hasLiked: false,
      hasBookmarked: false
    };

    // Prepend to posts feed immediately
    setPosts(prevPosts => [freshPost, ...prevPosts]);

    // Save to Supabase 'posts' table
    try {
      const rowToPersist = {
        id: postId,
        title: freshPost.title,
        description: freshPost.description,
        category: freshPost.category,
        image: finalImageUrl,
        image_url: finalImageUrl,
        likes: 0,
        address: freshPost.address || null,
        tag: freshPost.tag || null,
        username: user.username,
        time_elapsed: 'Just now',
        timeElapsed: 'Just now',
        is_promoted: !!freshPost.isPromoted,
        promotion_coupon: freshPost.category === 'promotions' ? 'CITYTALK20' : null
      };
      await supabase.from('posts').insert([rowToPersist]);
    } catch (err) {
      console.error("Failed saving post row to Supabase:", err);
    }

    // Also copy to user profile's historic actions for maximum fidelity representation!
    const newHistoricalPost = {
      id: freshPost.id,
      title: freshPost.title,
      image: finalImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400&h=400',
      category: freshPost.category,
      likes: 0,
      commentsCount: 0
    };
    setUserHistoricalPosts(prevHistory => [newHistoricalPost, ...prevHistory]);
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    try {
      // 1. Delete from Supabase Database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error("Supabase post deletion failed:", error);
        throw error;
      }

      // 2. Clear from local state list (home feed)
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

      // 3. Clear from historicalPosts state list (user profile)
      setUserHistoricalPosts(prevHistory => prevHistory.filter(p => p.id !== postId));

      triggerNotification('message', 'System Help 🤖', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', 'Your post has been deleted permanently from the database.');
    } catch (err: any) {
      console.error("General failure deleting post:", err);
      alert("Failed to delete post: " + (err.message || err));
      throw err;
    }
  };

  const markNotificationsAsRead = () => {
    setNotifications(
      notifications.map(n => ({ ...n, read: true }))
    );
  };

  // Filter count map
  const getFilterCounts = () => {
    const filteredByCity = posts; // We keep a unified list but we can filter by active tags/cities if wanted
    return {
      all: filteredByCity.length,
      locals: filteredByCity.filter(p => p.category === 'locals').length,
      promotions: filteredByCity.filter(p => p.category === 'promotions').length,
      society: filteredByCity.filter(p => p.category === 'society').length,
    };
  };

  // Selected list of posts based on current filtering and search query
  const getFilteredPosts = () => {
    let list = posts;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        p.username.toLowerCase().includes(q)
      );
    }
    return list;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="space-y-4 text-center animate-fade-in">
          <div className="inline-flex justify-center items-center p-3.5 bg-slate-900 text-white rounded-3xl animate-pulse">
            <NavIcon className="w-8 h-8 text-indigo-400 fill-indigo-400 rotate-45 animate-spin" />
          </div>
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Syncing CityTalk Secure Hub...</h1>
          <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">Establishing Supabase Session</p>
        </div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return (
      <Auth 
        onAuthComplete={(newSession) => handleAuthComplete(newSession)}
        onContinueAsGuest={() => setIsGuest(true)}
      />
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-6 font-sans relative">
      
      {/* Real-time Notification Banners layer (At the very top of screen viewport) */}
      <NotificationBanner
        notifications={bannerNotifs}
        onDismiss={(id) => setBannerNotifs(prev => prev.filter(b => b.id !== id))}
      />

      {/* Shared Navigation Layer */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveProfileUsername(null); // automatic return
        }}
        openCreateModal={() => {
          if (isGuest) {
            setAuthActionWarning("Creating postings is reserved for verified residents. Register with email to publish!");
            return;
          }
          setCreateModalOpen(true);
        }}
        selectedCity={selectedCity}
        setSelectedCity={(city) => {
          setSelectedCity(city);
          setActiveProfileUsername(null); // change city resets search view
        }}
        user={user}
        notifications={notifications}
        markNotificationsAsRead={markNotificationsAsRead}
        isGuest={isGuest}
        onSignOut={handleSignOut}
      />

      {/* Main Container Layout */}
      <div id="app-viewport-wrapper" className="max-w-4xl mx-auto px-4 pt-4 md:pl-64">
        
        {/* Animated View Transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeProfileUsername ? `profile-${activeProfileUsername}` : activeTab}
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full pb-8"
          >
            {activeProfileUsername ? (
              <OtherUserProfile
                username={activeProfileUsername}
                allPosts={posts}
                onBack={() => setActiveProfileUsername(null)}
                onSendSimulationMessage={(fromUser, text) => {
                  triggerNotification('message', fromUser.username, fromUser.avatar, text);
                }}
              />
            ) : (
              <>
                {/* 1. HOME FEED VIEW */}
                {activeTab === 'feed' && (
                  <div id="home-feed-screen" className="space-y-4">
                    
                    {/* Local Hero Header */}
                    <div id="feed-hero-header" className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-3xl p-5 text-white shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h1 className="text-md sm:text-base font-black tracking-tight flex items-center gap-1.5 text-white">
                          <NavIcon className="w-4 h-4 text-indigo-400 animate-pulse" /> Welcome to {selectedCity.name} CityTalk
                        </h1>
                        <p className="text-xs text-indigo-200 mt-1">
                          Helping {selectedCity.zone} connect, support local businesses, and resolve civic complaints fast.
                        </p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center">
                        <button
                          onClick={syncFeedFromSupabase}
                          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Fetch clean live updates from Supabase"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Sync DB</span>
                        </button>
                        <button
                          id="hero-floating-create"
                          onClick={() => {
                            if (isGuest) {
                              setAuthActionWarning("Creating posts is reserved for verified residents. Connect your email to begin posting!");
                              return;
                            }
                            setCreateModalOpen(true);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5 animate-bounce-slow" /> Post to Feed
                        </button>
                      </div>
                    </div>

                    {/* Real-time Interaction Simulator Panel */}
                    <div id="activity-simulator-card" className="bg-white rounded-3xl border border-indigo-100 p-4.5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl -z-10" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Live Activity Simulator
                          </h4>
                        </div>
                        
                        <button
                          onClick={() => setAutoSimulate(!autoSimulate)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer border ${
                            autoSimulate 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-black' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {autoSimulate ? (
                            <>
                              <Pause className="w-3 h-3 text-emerald-600 animate-spin" /> Auto simulating (18s)
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-slate-500" /> Start Auto Engine
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-semibold">
                        Click below to instantly broadcast a simulated community interaction across town and test the active banner alerts and unread badges:
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <button
                          onClick={() => {
                            const actor = MOCK_ACTORS[Math.floor(Math.random() * MOCK_ACTORS.length)];
                            triggerNotification('like', actor.username, actor.avatar, 'liked your Sourdough Success home bake post! 👍');
                          }}
                          className="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-150 text-[10.5px] font-black py-2.5 px-2 rounded-xl text-slate-800 hover:text-rose-700 transition-all flex items-center justify-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95"
                        >
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Like Event
                        </button>

                        <button
                          onClick={() => {
                            const actor = MOCK_ACTORS[Math.floor(Math.random() * MOCK_ACTORS.length)];
                            triggerNotification('comment', actor.username, actor.avatar, 'commented: "Wow, we really need this in our neighborhood area!"');
                          }}
                          className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-150 text-[10.5px] font-black py-2.5 px-2 rounded-xl text-slate-800 hover:text-indigo-700 transition-all flex items-center justify-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95"
                        >
                          <MessageCircle className="w-3 h-3 text-indigo-550" /> Comment
                        </button>

                        <button
                          onClick={() => {
                            const actor = MOCK_ACTORS[Math.floor(Math.random() * MOCK_ACTORS.length)];
                            triggerNotification('message', actor.username, actor.avatar, 'Hey neighbor! Can we schedule a quick badminton session or check coupon details?');
                          }}
                          className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-150 text-[10.5px] font-black py-2.5 px-2 rounded-xl text-slate-800 hover:text-emerald-700 transition-all flex items-center justify-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-550" /> Message DM
                        </button>
                      </div>
                    </div>

                    {/* Level 1: Sleek Home Feed Search Bar */}
                    <div id="feed-search-bar-wrapper" className="bg-white rounded-3xl p-4.5 border border-slate-150 shadow-xs space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl -z-10" />
                      <div className="flex items-center gap-2 mb-0.5">
                        <Search className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Search Community Feed
                        </h4>
                        {searchQuery && (
                          <span className="text-[10px] text-white bg-indigo-600 font-bold px-2 py-0.5 rounded-full ml-auto animate-fade-in">
                            Showing {getFilteredPosts().length} matches
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search post titles, descriptions, areas, tags, or @usernames..."
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-3xs"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-450 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Clear search query"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vertical Category Filter Pillar */}
                    <FeedFilter
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      counts={getFilterCounts()}
                    />

                    {/* Posts stream */}
                    <div id="posts-scrolling-container" className="space-y-4">
                      {getFilteredPosts().length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center text-slate-500 space-y-2 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800">No active listings in this category yet.</p>
                          <p className="text-xs text-slate-400">Be the first verified resident of {selectedCity.name} to write one!</p>
                          <button
                            onClick={() => {
                              if (isGuest) {
                                setAuthActionWarning("Creating posts is reserved for verified residents. Connect your email to begin posting!");
                                return;
                              }
                              setCreateModalOpen(true);
                            }}
                            className="mt-2.5 inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100"
                          >
                            Write Post
                          </button>
                        </div>
                      ) : (
                        getFilteredPosts().map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLike={handleLike}
                            onBookmark={handleBookmark}
                            onAddComment={handleAddComment}
                            onUserClick={(username) => {
                              setActiveProfileUsername(username);
                            }}
                          />
                        ))
                      )}
                    </div>

                  </div>
                )}

                {/* 2. PAGES / FOLLOWING DIRECTORIES VIEW */}
                {activeTab === 'pages' && (
                  <PagesFollowing />
                )}

                {/* 3. USER INTERACTIVE PROFILE VIEW */}
                {activeTab === 'profile' && (
                  <UserProfile
                    user={user}
                    onUpdateUser={setUser}
                    historicalPosts={userHistoricalPosts}
                    isGuest={isGuest}
                    onSignOut={handleSignOut}
                    onDeletePost={handleDeletePost}
                  />
                )}
              </>
            )}

          </motion.main>
        </AnimatePresence>

      </div>

      {/* Instagram-style floating creation trigger popup */}
      <AnimatePresence>
        {createModalOpen && (
          <CreatePostModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreatePost}
            selectedCityName={selectedCity.name}
          />
        )}
      </AnimatePresence>

      {/* Guest Authentication Intercept popup */}
      <AnimatePresence>
        {authActionWarning && (
          <div id="auth-action-warning-scrim" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-100 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
              
              <button 
                onClick={() => setAuthActionWarning(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Resident Verification Required</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {authActionWarning}
                </p>
                <p className="text-[10px] text-indigo-500 font-bold bg-indigo-50/50 py-1.5 px-3 rounded-lg inline-block">
                  🛡️ Prevent local spam • Build real neighborhood trust
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    setAuthActionWarning(null);
                    setIsGuest(false); // triggers login component to appear!
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Sign In or Sign Up Now
                </button>
                <button
                  onClick={() => setAuthActionWarning(null)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Continue Browsing Read-Only
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
