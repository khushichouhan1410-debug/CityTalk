export type Category = 'locals' | 'promotions' | 'society';

export interface Comment {
  id: string;
  username: string;
  userAvatar: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  timeElapsed: string;
  title: string;
  description: string;
  category: Category;
  image?: string;
  likes: number;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  comments: Comment[];
  address?: string; // Specific location in the city
  tag?: string;     // E.g., "Carpooling", "Water Bill", "New Gym"
  isPromoted?: boolean;
  promotionCoupon?: string;
  locationDetails?: string;
}

export interface User {
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  verifiedLocal?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'alert';
  username: string;
  userAvatar: string;
  message: string;
  time: string;
  postId?: string;
  postTitle?: string;
  read: boolean;
}
