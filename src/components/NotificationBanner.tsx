import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, MessageSquare, X, BellRing } from 'lucide-react';

export interface BannerNotification {
  id: string;
  type: 'like' | 'comment' | 'message';
  actorName: string;
  actorAvatar: string;
  text: string;
  time?: string;
}

interface NotificationBannerProps {
  notifications: BannerNotification[];
  onDismiss: (id: string) => void;
}

export default function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  return (
    <div id="notification-banner-container" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-indigo-100 rounded-2xl shadow-xl p-3.5 flex items-center gap-3.5 relative overflow-hidden"
          >
            {/* Top border colored band based on type */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              notif.type === 'like' ? 'bg-rose-500' :
              notif.type === 'comment' ? 'bg-indigo-600' : 'bg-emerald-500'
            }`} />

            {/* Actor Avatar with indicator */}
            <div className="relative flex-shrink-0">
              <img
                src={notif.actorAvatar}
                alt={notif.actorName}
                className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-3xs"
                referrerPolicy="no-referrer"
              />
              <span className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white ${
                notif.type === 'like' ? 'bg-rose-500' :
                notif.type === 'comment' ? 'bg-indigo-600' : 'bg-emerald-500'
              }`}>
                {notif.type === 'like' && <Heart className="w-2.5 h-2.5 fill-white text-white" />}
                {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 fill-white text-white" />}
                {notif.type === 'message' && <MessageSquare className="w-2.5 h-2.5 fill-white text-white" />}
              </span>
            </div>

            {/* Notification Text */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-gray-950">@{notif.actorName}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150 ml-auto">
                  {notif.type === 'message' ? 'Direct Message' : notif.type}
                </span>
              </div>
              <p className="text-[11px] text-gray-700 font-medium mt-0.5 leading-relaxed line-clamp-2">
                {notif.text}
              </p>
            </div>

            {/* Dismiss Close button */}
            <button
              onClick={() => onDismiss(notif.id)}
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors self-start cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
