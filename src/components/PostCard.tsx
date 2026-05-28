import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { Heart, MessageCircle, Share2, Bookmark, Send, Sparkles, MapPin, Tag, Flag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

interface PostCardProps {
  key?: React.Key;
  post: Post;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onUserClick?: (username: string) => void;
}

export default function PostCard({ post, onLike, onBookmark, onAddComment, onUserClick }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [couponClaimed, setCouponClaimed] = useState(false);

  // Post Reporting States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'Malicious Content' | 'Nudity' | 'Fake News'>('Malicious Content');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportError(null);
    try {
      const { error } = await supabase.from('reports').insert({
        post_id: post.id,
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
      }, 5000);
    } catch (err: any) {
      console.error("General error reporting post:", err);
      setReportError(err.message || 'Submission failed. Please verify that the "reports" table exists/has correct policy.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Style attributes based on category
  const getCategoryStyles = () => {
    switch (post.category) {
      case 'locals':
        return {
          bg: 'bg-indigo-50 text-indigo-700',
          border: 'border-indigo-100',
          accent: 'text-indigo-600',
          tagIconBg: 'bg-indigo-100 text-indigo-600'
        };
      case 'promotions':
        return {
          bg: 'bg-pink-50 text-pink-700',
          border: 'border-pink-100',
          accent: 'text-pink-600',
          tagIconBg: 'bg-pink-100 text-pink-500'
        };
      case 'society':
        return {
          bg: 'bg-amber-50 text-amber-800',
          border: 'border-amber-100',
          accent: 'text-amber-500',
          tagIconBg: 'bg-amber-100 text-amber-605'
        };
    }
  };

  const styles = getCategoryStyles();

  const handleShare = () => {
    setCopied(true);
    // Simulate clipboard copy
    const titleText = `${post.title} - Shared from CityTalk applet`;
    navigator.clipboard?.writeText?.(titleText).catch(() => {});
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(post.id, newCommentText);
    setNewCommentText('');
  };

  const claimCoupon = () => {
    setCouponClaimed(true);
    setTimeout(() => {
      // Just visually toggled
    }, 3000);
  };

  return (
    <div id={`post-card-${post.id}`} className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-5 relative">
      {/* Header */}
      <div id="card-header" className="p-4.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 relative cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onUserClick?.(post.username)}
          >
            <img
              src={post.userAvatar}
              alt={post.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {post.category === 'promotions' && (
              <span className="absolute -bottom-1 -right-1 bg-pink-600 border border-white text-[8px] text-white rounded-full p-0.5" title="Promoted Creator">
                ★
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                onClick={() => onUserClick?.(post.username)}
              >
                @{post.username}
              </span>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${styles.bg} ${styles.border}`}>
                {post.category}
              </span>
              {post.isPromoted && (
                <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Promoted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              <span className="font-medium">{post.timeElapsed}</span>
              {post.address && (
                <span className="flex items-center gap-0.5 max-w-[150px] truncate font-medium">
                  • <MapPin className="w-2.5 h-2.5 text-slate-400" /> {post.address}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
          {/* Dynamic Tag Identifier */}
          {post.tag && (
            <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${styles.bg} ${styles.border}`}>
              <Tag className="w-3 h-3" />
              {post.tag}
            </span>
          )}

          {/* Report Icon Button */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-rose-100"
            title="Report this post"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div id="card-body" className="px-4.5 pb-3">
        <h3 className="text-md font-bold text-slate-900 mb-1.5 tracking-tight hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-wrap">
          {post.description}
        </p>

        {/* Coupon Section (For Promotions) */}
        {post.category === 'promotions' && post.promotionCoupon && (
          <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100/40 border border-dashed border-pink-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Special Local Deal</p>
              <p className="text-xs font-semibold text-slate-800">Get discount using code: <span className="font-mono text-xs font-bold bg-white px-1.5 py-0.5 rounded border border-pink-200 text-pink-600">{post.promotionCoupon}</span></p>
            </div>
            <button
              onClick={claimCoupon}
              className={`text-[10.5px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                couponClaimed 
                  ? 'bg-indigo-600 text-white border-transparent shadow-md'
                  : 'bg-white hover:bg-pink-50 text-pink-600 border-pink-200 shadow-xs'
              }`}
            >
              {couponClaimed ? '✓ Claimed!' : 'Claim Code'}
            </button>
          </div>
        )}
      </div>

      {/* Image / Video Placeholder */}
      {post.image && (
        <div id="card-media-container" className="relative aspect-4/3 max-h-96 w-full bg-gray-50 border-y border-gray-50 overflow-hidden group">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      )}

      {/* Interaction Bar */}
      <div id="card-interaction-bar" className="px-4.5 py-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* Like Action */}
          <button
            id={`like-btn-${post.id}`}
            onClick={() => onLike(post.id)}
            className="group flex items-center gap-1.5 text-slate-605 hover:text-red-500 transition-colors cursor-pointer"
          >
            <motion.div
              animate={{ scale: post.hasLiked ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                id="heart-icon"
                className={`w-5 h-5 ${
                  post.hasLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-slate-500 group-hover:text-red-500'
                }`}
              />
            </motion.div>
            <span className={`text-xs font-bold ${post.hasLiked ? 'text-red-500 font-extrabold' : 'text-slate-600'}`}>
              {post.likes}
            </span>
          </button>

          {/* Comment Tab Toggle Action */}
          <button
            id={`comment-btn-${post.id}`}
            onClick={() => setShowComments(!showComments)}
            className="group flex items-center gap-1.5 text-slate-605 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <MessageCircle id="message-icon" className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">
              {post.comments.length}
            </span>
          </button>

          {/* Share Action */}
          <button
            id={`share-btn-${post.id}`}
            onClick={handleShare}
            className="group flex items-center gap-1.5 text-slate-605 hover:text-pink-600 transition-colors cursor-pointer"
            title="Copy post details"
          >
            <Share2 id="share-icon" className="w-4.5 h-4.5 text-slate-500 group-hover:text-pink-600" />
            <span className="text-xs font-medium hidden sm:inline group-hover:text-pink-600">Share</span>
          </button>

        </div>

        {/* Bookmark Action */}
        <button
          id={`bookmark-btn-${post.id}`}
          onClick={() => onBookmark(post.id)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all cursor-pointer"
          title="Save to bookmarks"
        >
          <Bookmark
            id="bookmark-icon"
            className={`w-5 h-5 ${
              post.hasBookmarked 
                ? 'fill-indigo-600 text-indigo-600' 
                : 'text-slate-500'
            }`}
          />
        </button>
      </div>

      {/* Copy notification popup */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute top-4 right-4 bg-indigo-600 text-white font-semibold text-xs py-1.5 px-3 rounded-xl shadow-lg flex items-center gap-1.5 z-10"
          >
            <span className="text-[10px] bg-white/20 p-0.5 rounded-full">✓</span> Link Copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Success Toast */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute inset-x-4 top-4 bg-emerald-600 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-lg flex items-center gap-1.5 z-30"
          >
            <span className="text-[10px] bg-white/20 p-1 rounded-full flex items-center justify-center w-5 h-5 flex-shrink-0">✓</span>
            <span className="flex-1">Thank you for reporting. Our moderation team will review this post.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Post Modal Dialog */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                        <span>Submitting report...</span>
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

      {/* Comments Drawer Expansion */}
      {showComments && (
        <div id="comments-tray" className="bg-slate-50 border-t border-slate-200 p-4 animate-in fade-in duration-350 rounded-b-3xl">
          
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discussion</h4>
            <span className="text-[10px] text-slate-400 font-medium">Be respectful & helpful</span>
          </div>

          <div id="comments-scrollbar" className="space-y-3.5 mb-3.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {post.comments.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start">
                  <div 
                    className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
                    onClick={() => onUserClick?.(comment.username)}
                  >
                    <img
                      src={comment.userAvatar}
                      alt={comment.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-150 shadow-3xs min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span 
                        className="text-[11px] font-black text-slate-900 hover:text-indigo-650 transition-colors cursor-pointer leading-none"
                        onClick={() => onUserClick?.(comment.username)}
                      >
                        @{comment.username}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">{comment.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal word-break break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add a Comment input form */}
          <form id="comment-add-form" onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Write a helpful reply down here..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-white border border-slate-200 text-xs px-3.5 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md shadow-indigo-100 active:scale-95 animate-in"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
