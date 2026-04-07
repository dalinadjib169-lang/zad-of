import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL: string;
  bio?: string;
  subject?: string;
  school?: string;
  wilaya?: string;
  level?: string;
  yearsOfExperience?: number;
  phoneNumber?: string;
  birthDate?: string;
  isProfileComplete?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  followers?: string[];
  following?: string[];
  friends?: string[];
  lastSeen?: Timestamp;
  createdAt: Timestamp;
  reminders?: {
    prayer?: boolean;
    water?: boolean;
    exercise?: boolean;
    exerciseDays?: number;
    waterGoal?: number;
    waterCurrent?: number;
    lastWaterReset?: Timestamp;
  };
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  wilaya: string;
  images: string[];
  status: 'available' | 'sold';
  createdAt: Timestamp;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  seen: boolean;
  reactions?: { [userId: string]: string };
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: string[];
  reactions?: { [userId: string]: string };
  commentCount: number;
  privacy: 'public' | 'friends' | 'private';
  background?: string | null;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  parentId?: string;
  replyTo?: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  read: boolean;
  createdAt: Timestamp;
}
