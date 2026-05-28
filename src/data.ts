import { Post, User, NotificationItem } from './types';

export const CITIES = [
  { id: 'indore', name: 'Indore, MP', zone: 'Vijay Nagar' },
  { id: 'bangalore', name: 'Bangalore, KA', zone: 'Koramangala' },
  { id: 'mumbai', name: 'Mumbai, MH', zone: 'Hiranandani' },
  { id: 'pune', name: 'Pune, MH', zone: 'Koregaon Park' },
  { id: 'delhi', name: 'New Delhi, DL', zone: 'Dwarka Sector 12' }
];

export const INITIAL_USER: User = {
  username: 'khushi_chouhan',
  fullName: 'Khushi Chouhan',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300',
  bio: 'Local Foodie ☕️ | Environmentalist 🌿 | Morning runner at Meghdoot Garden. Always up for a badminton session!',
  followersCount: 428,
  followingCount: 260,
  verifiedLocal: true
};

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    userId: 'user-2',
    username: 'indori_ranjit',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    timeElapsed: '2 hours ago',
    title: 'Weekend Badminton Match at Gold Gym Arena 🏸',
    description: 'Looking for 2 intermediate players to join us for a doubles match this Saturday morning from 7 AM to 9 AM at Vijay Nagar Sports Club. We already have 2 players. Courtyard fees will be shared equally!',
    category: 'locals',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800&h=600',
    likes: 18,
    hasLiked: false,
    hasBookmarked: false,
    tag: 'Sports Match',
    address: 'Vijay Nagar, Club Road',
    comments: [
      {
        id: 'c-1',
        username: 'sharma_ji',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100',
        text: 'Count me in! I play intermediate. DM me the group link.',
        time: '1h'
      },
      {
        id: 'c-2',
        username: 'preeti_run',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
        text: 'Are racket loaners available there?',
        time: '45m'
      }
    ]
  },
  {
    id: 'post-2',
    userId: 'user-3',
    username: 'crumbs_n_bakes',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    timeElapsed: '4 hours ago',
    title: 'Grand Opening: Crumbs & Bakes Cafe! 🍰☕️',
    description: 'Hey everyone! We are super thrilled to open our new sourdough and coffee house in Scheme 78. Introducing clean, no-preservative, wild-yeast breads and artisanal espresso. Use code CITYTALK20 for 20% off your first visit!',
    category: 'promotions',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800&h=600',
    likes: 42,
    hasLiked: true,
    hasBookmarked: true,
    tag: 'New Launch',
    address: 'Scheme No. 78, Opp. Apollo Hospital',
    isPromoted: true,
    promotionCoupon: 'CITYTALK20',
    comments: [
      {
        id: 'c-3',
        username: 'indore_hunger',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100&h=100',
        text: 'Sourdough looks incredible! Visiting this afternoon.',
        time: '3h'
      }
    ]
  },
  {
    id: 'post-3',
    userId: 'user-4',
    username: 'green_indore_civic',
    userAvatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200&h=200',
    timeElapsed: '6 hours ago',
    title: '⚠️ Heavy Water Logging Near Sector B Park Road',
    description: 'Please avoid Sector B Park Road (near the public fountain). The drains are completely choked, and water is about 1 foot high after this morning\'s sudden rain spell. Indori Municipal Team has been notified but please drive carefully and take the bypass instead!',
    category: 'society',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800&h=600',
    likes: 31,
    hasLiked: false,
    hasBookmarked: false,
    tag: 'Civic Alert',
    address: 'Sector B, Near Meghdoot Garden',
    comments: [
      {
        id: 'c-4',
        username: 'taxpayer_ajay',
        userAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100',
        text: 'This road gets flooded every single season. Thanks for the heads up, won\'t take my hatchback there today.',
        time: '5h'
      }
    ]
  },
  {
    id: 'post-4',
    userId: 'user-5',
    username: 'neha_carpool',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200',
    timeElapsed: '8 hours ago',
    title: 'Daily Carpool: Indore to Dewas Tech Park (Mon-Fri) 🚗',
    description: 'Looking for 2 poolers. I drive a brand new SUV from Scheme 54 standard routes (Bapat Chauraha -> Bypass -> Dewas Industrial Area). Leaving at 8:45 AM, return around 6:15 PM. Help split fuel and reduce city traffic emissions!',
    category: 'locals',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800&h=600',
    likes: 12,
    hasLiked: false,
    hasBookmarked: false,
    tag: 'Carpool',
    address: 'Scheme No. 54 (Bapat Chauraha)',
    comments: []
  },
  {
    id: 'post-5',
    userId: 'user-6',
    username: 'organic_indore',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    timeElapsed: '12 hours ago',
    title: 'Fresh Organic Mango Fest - Direct from Farms! 🥭',
    description: 'Get genuine, naturally ripened Kesari and Alphonso mangoes right at Indore Society Complex Main Gate this Thursday from 4 PM. Pesticide-free, sweet, and picked straight from our orchards in Khargone. Pre-orders get free organic mint bunches!',
    category: 'promotions',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800&h=600',
    likes: 29,
    hasLiked: false,
    hasBookmarked: false,
    tag: 'Local Produce',
    address: 'City Heights Society Gate 2',
    isPromoted: false,
    comments: [
      {
        id: 'c-5',
        username: 'fitness_mamma',
        userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100',
        text: 'Are you coming to Vijay Nagar area any day? Sells extremely well here!',
        time: '10h'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'like',
    username: 'indori_ranjit',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    message: 'liked your profile post on Clean Indore Mission',
    time: '20 min ago',
    postId: 'mypost-1',
    postTitle: 'Clean Indore Mission',
    read: false
  },
  {
    id: 'n-2',
    type: 'comment',
    username: 'sharma_ji',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100',
    message: 'commented: "Excellent suggestion, we should start this Sunday!"',
    time: '1 hour ago',
    postId: 'mypost-1',
    postTitle: 'Clean Indore Mission',
    read: false
  },
  {
    id: 'n-3',
    type: 'follow',
    username: 'preeti_run',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
    message: 'started following you',
    time: '5 hours ago',
    read: true
  },
  {
    id: 'n-4',
    type: 'alert',
    username: 'CityTalk Official',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100',
    message: 'Your promotion "Crumbs & Bakes Cafe" is picking up! 42 people liked this promotion nearby.',
    time: '1 day ago',
    read: true
  }
];

export const USER_HISTORICAL_POSTS = [
  {
    id: 'mypost-1',
    title: 'Clean Indore Society Drive 🧹',
    image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'society',
    likes: 84,
    commentsCount: 16
  },
  {
    id: 'mypost-2',
    title: 'Sourdough Success! First bake at home 🌾',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'locals',
    likes: 112,
    commentsCount: 9
  },
  {
    id: 'mypost-3',
    title: 'Lost Golden Retriever near Meghdoot Garden 🐶',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'society',
    likes: 156,
    commentsCount: 38
  },
  {
    id: 'mypost-4',
    title: 'Sunrise Yoga at Regional Park 🧘‍♀️',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'locals',
    likes: 67,
    commentsCount: 5
  },
  {
    id: 'mypost-5',
    title: 'Review: New organic green grocery on Ring Road 🥦',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'promotions',
    likes: 49,
    commentsCount: 11
  },
  {
    id: 'mypost-6',
    title: 'Evening Cycling Club: Join us today 🚴‍♀️',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400&h=400',
    category: 'locals',
    likes: 93,
    commentsCount: 14
  }
];
