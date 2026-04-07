import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  User, 
  Search, 
  Circle, 
  GraduationCap, 
  Image as ImageIcon, 
  Smile, 
  Mic, 
  Paperclip, 
  Video, 
  Phone, 
  MapPin, 
  Clock, 
  UserPlus, 
  UserCheck,
  Compass,
  BookOpen,
  Zap,
  FlaskConical,
  Brain,
  Music,
  Palette,
  Monitor,
  Languages,
  ScrollText,
  Dumbbell,
  Droplets,
  Moon,
  MoreVertical,
  Minimize2,
  Maximize2,
  StopCircle,
  Play,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit, Timestamp, updateDoc, doc, arrayUnion, arrayRemove, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { playSound } from '../lib/sounds';
import { useUpload } from '../hooks/useUpload';

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}

import { useUnreadMessages } from '../hooks/useUnreadMessages';

// Emoji Component
const AnimatedEmoji = ({ isOpen, setIsOpen, emojiState, setEmojiState, activeChat, setNewMessage }: { 
  isOpen: boolean, 
  setIsOpen: (v: boolean) => void, 
  emojiState: string, 
  setEmojiState: (s: any) => void,
  activeChat: any,
  setNewMessage: React.Dispatch<React.SetStateAction<string>>
}) => {
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    if (activeChat) {
      setNewMessage(prev => prev + emoji);
      setEmojiState('laughing');
      setTimeout(() => setEmojiState('happy'), 1000);
      setShowBubbleMenu(false);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {showBubbleMenu && (
          <motion.div
            key="bubble-menu"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex gap-2 z-[110]"
          >
            {['❤️', '😂', '👍', '🔥'].map(e => (
              <button 
                key={e} 
                onClick={() => handleEmojiClick(e)}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        onClick={() => {
          if (isOpen) setShowBubbleMenu(!showBubbleMenu);
          else setIsOpen(true);
        }}
        className="relative w-20 h-20 cursor-pointer active:scale-90 transition-transform"
        animate={{ 
          y: [0, -8, 0],
          rotate: emojiState === 'pointing' ? [0, 10, -10, 0] : 0,
          scale: emojiState === 'laughing' ? [1, 1.1, 1] : 1
        }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
      <div className={`w-full h-full rounded-full border-4 border-slate-900 shadow-2xl flex flex-col items-center justify-center transition-all duration-700 ${
        emojiState === 'happy' ? 'bg-gradient-to-br from-amber-300 to-amber-500' :
        emojiState === 'sad' ? 'bg-gradient-to-br from-blue-300 to-blue-500' :
        emojiState === 'angry' ? 'bg-gradient-to-br from-red-400 to-red-600' :
        emojiState === 'laughing' ? 'bg-gradient-to-br from-green-300 to-green-500' : 
        'bg-gradient-to-br from-purple-400 to-purple-600'
      }`}>
        {/* Eyes */}
        <div className="flex gap-4 mb-1">
          <motion.div 
            className="w-3 h-3 bg-slate-900 rounded-full relative"
            animate={{ 
              scaleY: emojiState === 'sleeping' ? 0.1 : (emojiState === 'awake' ? [1, 0.2, 1] : (emojiState === 'laughing' ? [1, 0.2, 1] : [1, 0.1, 1])),
              y: emojiState === 'angry' ? 2 : 0
            }}
            transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }}
          >
            {emojiState === 'angry' && (
              <div className="absolute -top-2 -left-1 w-5 h-1 bg-slate-900 rotate-[20deg]" />
            )}
          </motion.div>
          <motion.div 
            className="w-3 h-3 bg-slate-900 rounded-full relative"
            animate={{ 
              scaleY: emojiState === 'sleeping' ? 0.1 : (emojiState === 'awake' ? [1, 0.2, 1] : (emojiState === 'laughing' ? [1, 0.2, 1] : [1, 0.1, 1])),
              y: emojiState === 'angry' ? 2 : 0
            }}
            transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }}
          >
            {emojiState === 'angry' && (
              <div className="absolute -top-2 -right-1 w-5 h-1 bg-slate-900 -rotate-[20deg]" />
            )}
          </motion.div>
        </div>
        {/* Mouth */}
        <motion.div 
          className={`border-slate-900 transition-all duration-500 ${
            emojiState === 'happy' ? 'w-8 h-4 border-b-4 rounded-full' :
            emojiState === 'sad' ? 'w-8 h-4 border-t-4 rounded-full translate-y-2' :
            emojiState === 'angry' ? 'w-6 h-1.5 bg-slate-900 rounded-full' :
            emojiState === 'laughing' ? 'w-10 h-6 bg-slate-900 rounded-b-full' : 
            emojiState === 'sleeping' ? 'w-4 h-4 border-2 rounded-full' :
            emojiState === 'excited' ? 'w-10 h-8 border-b-4 rounded-full' :
            emojiState === 'awake' ? 'w-6 h-6 border-4 rounded-full' :
            'w-8 h-4 border-b-4 rounded-full'
          }`}
          animate={emojiState === 'laughing' ? { height: [12, 18, 12] } : (emojiState === 'sleeping' ? { scale: [1, 1.2, 1] } : (emojiState === 'awake' ? { scale: [1, 1.3, 1] } : {}))}
          transition={{ repeat: Infinity, duration: (emojiState === 'sleeping' || emojiState === 'awake') ? 2 : 0.5 }}
        />
        
        {/* Hands for pointing */}
        {emojiState === 'pointing' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 35 }}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          >
            <div className="w-8 h-4 bg-purple-400 border-2 border-slate-900 rounded-full relative">
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-2 bg-purple-400 border-2 border-slate-900 rounded-full" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  </div>
  );
};

export default function ChatBubble() {
  const { profile } = useAuth();
  const { startUpload } = useUpload();
  const unreadCount = useUnreadMessages();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('chat_bubble_open');
    return saved === 'true';
  });
  const [isHidden, setIsHidden] = useState(false);
  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  const [filterSameSubject, setFilterSameSubject] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalling, setIsCalling] = useState<'video' | 'audio' | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emojiState, setEmojiState] = useState<'happy' | 'sad' | 'angry' | 'laughing' | 'pointing' | 'sleeping' | 'excited' | 'awake'>('sleeping');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [lastOpenTime, setLastOpenTime] = useState<number>(Date.now());
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId for reactions, or 'input' for new message
  const typingTimeoutRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (scrollRef.current && isOpen && activeChat) {
      const scrollContainer = scrollRef.current;
      // Use multiple frames to ensure DOM is fully rendered and images (if any) are accounted for
      const scrollToBottom = () => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      };
      
      requestAnimationFrame(scrollToBottom);
      // Extra safety for slower renders or images loading
      const timeout = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, activeChat?.uid, isOpen]);

  useEffect(() => {
    localStorage.setItem('chat_bubble_open', isOpen.toString());
  }, [isOpen]);

  useEffect(() => {
    const handleShowChat = (e: any) => {
      if (e.detail) {
        setActiveChat(e.detail);
      }
      setIsOpen(true);
    };
    window.addEventListener('show-chat', handleShowChat);
    return () => window.removeEventListener('show-chat', handleShowChat);
  }, []);

  useEffect(() => {
    if (!profile) return;

    // Global listener for new unread messages to play sound
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', profile.uid),
      where('seen', '==', false)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const hasNewMessage = snapshot.docChanges().some(
        change => change.type === 'added' && change.doc.data().senderId !== profile.uid
      );
      if (hasNewMessage) {
        playSound('message');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      setEmojiState('awake');
    } else if (isOpen) {
      setEmojiState('excited');
      setLastOpenTime(Date.now());
      // Reset to happy after a while
      const timer = setTimeout(() => setEmojiState('happy'), 3000);
      return () => clearTimeout(timer);
    } else {
      setEmojiState('sleeping');
    }
  }, [unreadCount, isOpen]);

  // Handle "Closing eyes" after 1 hour of no opening
  useEffect(() => {
    if (isOpen) return;
    
    const timeout = setTimeout(() => {
      setEmojiState('sleeping');
    }, 3600000); // 1 hour
    
    return () => clearTimeout(timeout);
  }, [isOpen, lastOpenTime]);

  // Typing Indicator Logic
  useEffect(() => {
    if (!profile || !activeChat) return;
    const roomId = activeChat.uid === 'global' ? 'global' : [profile.uid, activeChat.uid].sort().join('_');
    
    const typingRef = doc(db, 'typing', roomId);
    const unsubscribe = onSnapshot(typingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (activeChat.uid === 'global') {
          // In global chat, check if anyone else is typing
          const othersTyping = Object.entries(data).some(([uid, isTyping]) => uid !== profile.uid && uid !== 'participants' && isTyping);
          setIsOtherTyping(othersTyping);
        } else {
          const otherUserId = activeChat.uid;
          setIsOtherTyping(!!data[otherUserId] && otherUserId !== 'participants');
        }
      } else {
        setIsOtherTyping(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `typing/${roomId}`);
    });

    return unsubscribe;
  }, [profile, activeChat]);

  // Mark messages as seen (VU) - Optimized with writeBatch for real-time performance
  useEffect(() => {
    if (!profile || !activeChat || !isOpen || activeChat.uid === 'global') return;
    
    const roomId = [profile.uid, activeChat.uid].sort().join('_');
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      where('participants', 'array-contains', profile.uid),
      where('senderId', '!=', profile.uid),
      where('seen', '==', false)
    );

    const unsubscribeSeen = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(doc(db, 'messages', d.id), { seen: true });
      });
      
      try {
        await batch.commit();
      } catch (e) {
        console.error("Error committing seen batch:", e);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return unsubscribeSeen;
  }, [profile, activeChat, isOpen]);

  const handleTyping = async (isTyping: boolean) => {
    if (!profile || !activeChat) return;
    const roomId = activeChat.uid === 'global' ? 'global' : [profile.uid, activeChat.uid].sort().join('_');
    const typingRef = doc(db, 'typing', roomId);
    
    // Use a local ref to prevent redundant writes
    const lastWrite = (window as any).lastTypingWrite || 0;
    const now = Date.now();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Only write to Firestore if status changed or 2 seconds passed since last write
    if (isTyping !== (window as any).isCurrentlyTyping || (isTyping && now - lastWrite > 2000)) {
      (window as any).isCurrentlyTyping = isTyping;
      (window as any).lastTypingWrite = now;
      
      try {
        const participants = activeChat.uid === 'global' ? ['global'] : [profile.uid, activeChat.uid];
        await setDoc(typingRef, { 
          [profile.uid]: isTyping,
          participants: participants 
        }, { merge: true });
      } catch (e) {
        console.error("Typing error:", e);
      }
    }
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        (window as any).isCurrentlyTyping = false;
        const participants = activeChat.uid === 'global' ? ['global'] : [profile.uid, activeChat.uid];
        setDoc(typingRef, { 
          [profile.uid]: false,
          participants: participants
        }, { merge: true });
      }, 4000);
    }
  };

  // Random emoji state changes to make it look "alive"
  useEffect(() => {
    if (isOpen || unreadCount > 0) return;
    
    const interval = setInterval(() => {
      const states: ('happy' | 'pointing' | 'laughing' | 'angry' | 'sad')[] = ['happy', 'pointing', 'laughing'];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setEmojiState(randomState);
      
      // Reset to happy after 3 seconds
      setTimeout(() => {
        if (!isOpen) setEmojiState('happy');
      }, 3000);
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reminders Logic - Removed polling setInterval as per user request for real-time performance
  useEffect(() => {
    if (!profile?.reminders) return;
    // Reminders are now handled via system events or triggers rather than polling
  }, [profile]);

  // Handle Incoming Calls
  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'calls'),
      where('recipientId', '==', profile.uid),
      where('status', '==', 'ringing'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      if (!snapshot.empty) {
        const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setIncomingCall(callData);
        if (!ringtoneRef.current) {
          ringtoneRef.current = playSound('ringtone', true);
        }
        setEmojiState('happy');
      } else {
        setIncomingCall(null);
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current = null;
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calls');
    });

    return () => {
      unsubscribe();
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || !activeChat) {
      setMessages([]);
      return;
    }

    const roomId = activeChat.uid === 'global' ? 'global' : [profile.uid, activeChat.uid].sort().join('_');
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      where('participants', 'array-contains', activeChat.uid === 'global' ? 'global' : profile.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data,
          id: doc.id, 
          // Handle local estimate for createdAt to ensure instant appearance at the end
          createdAt: data.createdAt || Timestamp.now(),
          clientCreatedAt: data.clientCreatedAt || Date.now()
        };
      }) as any[];
      
      // Sort ascending locally for display (oldest to newest)
      msgs.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : a.createdAt;
        const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : b.createdAt;
        return timeA - timeB;
      });
      
      setMessages(msgs);
      
      if (snapshot.docChanges().some(change => change.type === 'added' && change.doc.data().senderId !== profile.uid)) {
        playSound('message');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'messages');
    });

    return unsubscribe;
  }, [profile, activeChat]);

  // Real-time users status listener
  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'users'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setUsers(allUsers.filter(u => u.uid !== profile.uid));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const user = e.detail as UserProfile;
      setActiveChat(user);
      setIsOpen(true);
    };

    window.addEventListener('openChat', handleOpenChat);
    
    const handleStartCallEvent = (e: any) => {
      const { type, user } = e.detail;
      setActiveChat(user);
      setIsOpen(true);
      setTimeout(() => {
        handleStartCall(type);
      }, 500);
    };

    window.addEventListener('startCall', handleStartCallEvent);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('startCall', handleStartCallEvent);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent, type: 'text' | 'image' | 'audio' = 'text', file?: File) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !file && type === 'text') return;
    if (!profile || !activeChat) return;

    const roomId = activeChat.uid === 'global' ? 'global' : [profile.uid, activeChat.uid].sort().join('_');
    const participants = activeChat.uid === 'global' ? ['global'] : [profile.uid, activeChat.uid].sort();
    
    try {
      if (file) {
        const messageData = {
          roomId,
          participants,
          senderId: profile.uid,
          senderName: profile.displayName,
          createdAt: serverTimestamp(),
          clientCreatedAt: Date.now(),
          seen: false,
        };
        
        await startUpload(file, 'message', messageData);
        setEmojiState('happy');
        return;
      }

      // OPTIMISTIC UI: Clear input immediately and let onSnapshot handle the local update
      const messageText = newMessage;
      setNewMessage('');
      
      const messageData: any = {
        roomId,
        participants,
        senderId: profile.uid,
        senderName: profile.displayName,
        createdAt: serverTimestamp(),
        clientCreatedAt: Date.now(),
        seen: false,
        text: messageText
      };

      // Add to Firestore - onSnapshot with includeMetadataChanges will show it instantly
      await addDoc(collection(db, 'messages'), messageData);
      setEmojiState('happy');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
      setEmojiState('sad');
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        handleSendMessage(null as any, 'audio', file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error starting recording:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please enable it in your browser settings to record voice notes.");
      } else {
        alert("Could not start recording. Please check your microphone connection.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!profile || !activeChat) return;
    setIsCalling(type);
    try {
      await addDoc(collection(db, 'calls'), {
        senderId: profile.uid,
        senderName: profile.displayName,
        senderPhoto: profile.photoURL,
        recipientId: activeChat.uid,
        type,
        status: 'ringing',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Call error:", err);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'connected' });
      // In a real app, start WebRTC here
      setIncomingCall(null);
    } catch (err) {
      console.error("Accept call error:", err);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
      
      // Add missed call notification
      await addDoc(collection(db, 'notifications'), {
        recipientId: profile?.uid,
        senderId: incomingCall.senderId,
        senderName: incomingCall.senderName,
        type: 'missed_call',
        callType: incomingCall.type,
        read: false,
        createdAt: serverTimestamp(),
        clientCreatedAt: Date.now()
      });
      
      setIncomingCall(null);
    } catch (err) {
      console.error("Reject call error:", err);
    }
  };

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('رياضيات') || s.includes('math')) return <Compass className="w-3 h-3" />;
    if (s.includes('عربية') || s.includes('arabic')) return <ScrollText className="w-3 h-3" />;
    if (s.includes('فيزياء') || s.includes('physics')) return <Zap className="w-3 h-3" />;
    if (s.includes('علوم') || s.includes('science')) return <FlaskConical className="w-3 h-3" />;
    if (s.includes('فلسفة') || s.includes('philosophy')) return <Brain className="w-3 h-3" />;
    if (s.includes('فرنسية') || s.includes('french') || s.includes('إنجليزية') || s.includes('english')) return <Languages className="w-3 h-3" />;
    if (s.includes('تاريخ') || s.includes('جغرافيا') || s.includes('history')) return <MapPin className="w-3 h-3" />;
    if (s.includes('إسلامية') || s.includes('islamic')) return <BookOpen className="w-3 h-3" />;
    if (s.includes('بدنية') || s.includes('physical')) return <Dumbbell className="w-3 h-3" />;
    if (s.includes('إعلام') || s.includes('computer')) return <Monitor className="w-3 h-3" />;
    if (s.includes('فنية') || s.includes('arts')) return <Palette className="w-3 h-3" />;
    if (s.includes('موسيقية') || s.includes('music')) return <Music className="w-3 h-3" />;
    return <GraduationCap className="w-3 h-3" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMessage(null as any, file.type.startsWith('image') ? 'image' : 'text', file);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSameSubject ? u.subject === profile.subject : true;
    return matchesSearch && matchesSubject;
  });

  const handleConnect = async () => {
    if (!profile || !activeChat || activeChat.uid === 'global') return;
    setIsConnecting(true);
    try {
      const isFollowing = profile.following?.includes(activeChat.uid);
      const userRef = doc(db, 'users', profile.uid);
      const targetRef = doc(db, 'users', activeChat.uid);

      if (isFollowing) {
        await updateDoc(userRef, { following: arrayRemove(activeChat.uid) });
        await updateDoc(targetRef, { followers: arrayRemove(profile.uid) });
      } else {
        await updateDoc(userRef, { following: arrayUnion(activeChat.uid) });
        await updateDoc(targetRef, { followers: arrayUnion(profile.uid) });
        
        // Add notification
        await addDoc(collection(db, 'notifications'), {
          recipientId: activeChat.uid,
          senderId: profile.uid,
          senderName: profile.displayName,
          type: 'follow',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!profile || isHidden) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="chat-bubble-window"
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            className="absolute bottom-24 right-0 w-80 sm:w-96 h-[500px] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col shadow-purple-500/10 z-50"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat ? (
                  <>
                    <button onClick={() => setActiveChat(null)} className="text-white/80 hover:text-white transition-colors">
                      <X className="w-5 h-5 rotate-45" />
                    </button>
                    <div className="relative">
                      <img 
                        src={activeChat.photoURL} 
                        className="w-10 h-10 rounded-2xl object-cover border-2 border-white/20" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm leading-tight">{activeChat.displayName}</h4>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-white/90 flex items-center gap-1">
                          {getSubjectIcon(activeChat.subject || '')}
                          {activeChat.subject || 'Teacher'} • {activeChat.level || 'General'}
                        </p>
                        <p className="text-[9px] font-bold text-white/70 flex items-center gap-1">
                          <MapPin className="w-2 h-2" /> {activeChat.wilaya || 'Algeria'} • <Clock className="w-2 h-2" /> {activeChat.yearsOfExperience || 0} ans exp
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/20 p-2 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-black text-white">Teacher Lounge</h4>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeChat && activeChat.uid !== 'global' && (
                  <>
                    <button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className={`p-2 rounded-xl transition-all ${profile?.following?.includes(activeChat.uid) ? 'text-green-400 bg-green-400/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                      title={profile?.following?.includes(activeChat.uid) ? "Connected" : "Connect"}
                    >
                      {profile?.following?.includes(activeChat.uid) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleStartCall('audio')}
                      className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"
                      title="Audio Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStartCall('video')}
                      className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col bg-slate-950/50 overflow-hidden relative">
              {/* Calling Overlay */}
              <AnimatePresence initial={false}>
                {isCalling && (
                  <motion.div
                    key="calling-overlay"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                      <img 
                        src={activeChat?.photoURL} 
                        className="w-24 h-24 rounded-3xl object-cover ring-4 ring-purple-500/30 relative z-10" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">{activeChat?.displayName}</h3>
                    <p className="text-purple-400 font-bold text-sm mb-12 animate-pulse">
                      {isCalling === 'video' ? 'Starting Video Call...' : 'Calling...'}
                    </p>
                    
                    <div className="flex gap-6">
                      <button 
                        onClick={() => setIsCalling(null)}
                        className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-90"
                      >
                        <X className="w-8 h-8" />
                      </button>
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 animate-bounce">
                        {isCalling === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                      </div>
                    </div>
                    
                    <p className="mt-12 text-slate-500 text-xs font-bold">
                      Waiting for {activeChat?.displayName} to join...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!activeChat ? (
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search colleagues..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setFilterSameSubject(false)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${!filterSameSubject ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterSameSubject(true)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filterSameSubject ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                    >
                      Same Subject
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {/* Global Chat Option */}
                    <button
                      onClick={() => setActiveChat({
                        uid: 'global',
                        displayName: 'Global Teacher Lounge',
                        photoURL: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=100&h=100&fit=crop',
                        email: '',
                        createdAt: Timestamp.now()
                      } as any)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <Circle className="absolute -bottom-1 -right-1 w-3 h-3 fill-green-500 text-slate-900" />
                      </div>
                      <div className="text-left">
                        <h5 className="text-sm font-black text-purple-400">Global Chat</h5>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All Teachers</p>
                      </div>
                    </button>

                    {filteredUsers.map(u => (
                      <button
                        key={u.uid}
                        onClick={() => setActiveChat(u)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all group"
                      >
                        <div className="relative">
                          <img 
                            src={u.photoURL} 
                            className="w-10 h-10 rounded-xl object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <Circle className="absolute -bottom-1 -right-1 w-3 h-3 fill-green-500 text-slate-900" />
                        </div>
                        <div className="text-left">
                          <h5 className="text-sm font-black text-slate-100 group-hover:text-purple-400 transition-colors">{u.displayName}</h5>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{u.subject || 'Teacher'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === profile.uid ? 'items-end' : 'items-start'}`}>
                        <div className="group relative">
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                            msg.senderId === profile.uid 
                              ? 'bg-purple-600 text-white rounded-tr-none' 
                              : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800'
                          }`}>
                            {msg.text && <p>{msg.text}</p>}
                            {msg.imageUrl && (
                              <img 
                                src={msg.imageUrl} 
                                className="rounded-xl max-w-full h-auto mb-1" 
                                alt="Chat media" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {msg.audioUrl && (
                              <audio src={msg.audioUrl} controls className="w-full h-8 mt-1" />
                            )}
                            
                            {/* Reactions Display */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="absolute -bottom-2 right-0 flex -space-x-1">
                                {Array.from(new Set(Object.values(msg.reactions))).map((emoji: any, i) => (
                                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-full px-1 text-[10px] shadow-lg">
                                    {emoji}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reaction Picker Trigger */}
                            <div className={`absolute top-0 ${msg.senderId === profile.uid ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                              <button 
                                onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-purple-400 transition-colors shadow-lg border border-slate-700"
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                              
                              <AnimatePresence initial={false}>
                                {showEmojiPicker === msg.id && (
                                  <motion.div 
                                    key={`picker-${msg.id}`}
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full p-1.5 flex gap-1 shadow-2xl z-50"
                                  >
                                    {['❤️', '😂', '😮', '😢', '👍', '🔥'].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => {
                                          const msgRef = doc(db, 'messages', msg.id);
                                          updateDoc(msgRef, { [`reactions.${profile.uid}`]: emoji });
                                          setShowEmojiPicker(null);
                                        }}
                                        className="hover:scale-125 transition-transform p-1"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <p className={`text-[10px] font-bold ${msg.senderId === profile.uid ? 'text-white/60' : 'text-slate-500'}`}>
                            {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                          {msg.senderId === profile.uid && (
                            <span className={`text-[9px] font-black uppercase tracking-widest ${msg.seen ? 'text-purple-400' : 'text-white/40'}`}>
                              {msg.seen ? 'VU' : 'Envoyé'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isOtherTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {activeChat?.uid === 'global' ? 'Someone' : activeChat?.displayName.split(' ')[0]} is typing... / يكتب...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={(e) => {
                    handleSendMessage(e);
                    handleTyping(false);
                  }} className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={isUploading ? "Uploading..." : "Type your message..."}
                        disabled={isUploading}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium disabled:opacity-50"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping(e.target.value.length > 0);
                        }}
                        onBlur={() => handleTyping(false)}
                      />
                      <button 
                        type="submit" 
                        disabled={isUploading}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-4">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-slate-500 hover:text-purple-400 transition-colors"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')}
                          className={`transition-colors ${showEmojiPicker === 'input' ? 'text-purple-400' : 'text-slate-500 hover:text-purple-400'}`}
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {showEmojiPicker === 'input' && (
                            <motion.div 
                              key="input-emoji-picker"
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute bottom-full mb-4 left-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 flex flex-wrap gap-2 max-w-[200px]"
                            >
                              {['❤️', '😂', '😮', '😢', '👍', '🔥', '👏', '🎉', '🙏', '✨', '📚', '🎓'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setNewMessage(prev => prev + emoji);
                                    setShowEmojiPicker(null);
                                  }}
                                  className="text-xl hover:scale-125 transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <button type="button" className="text-slate-500 hover:text-purple-400 transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </button>
                      </div>
                      <button 
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`p-2 rounded-full transition-all relative ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-800'}`}
                      >
                        <Mic className="w-5 h-5" />
                        {isRecording && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap">
                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileSelect}
                    />
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        drag
        dragMomentum={false}
        className="relative"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group cursor-pointer"
        >
          <AnimatedEmoji 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        emojiState={emojiState} 
        setEmojiState={setEmojiState}
        activeChat={activeChat}
        setNewMessage={setNewMessage}
      />
          {!isOpen && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white animate-bounce">
              {unreadCount}
            </div>
          )}
        </motion.div>

        {/* Incoming Call UI */}
        <AnimatePresence initial={false}>
          {incomingCall && (
            <motion.div
              key={`incoming-call-${incomingCall.id}`}
              initial={{ opacity: 0, scale: 0.8, x: -100 }}
              animate={{ opacity: 1, scale: 1, x: -250 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-0 right-20 w-64 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 w-full">
                <img src={incomingCall.senderPhoto} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className="flex-1 text-left">
                  <h5 className="text-white font-bold text-sm truncate">{incomingCall.senderName}</h5>
                  <p className="text-purple-400 text-[10px] font-black animate-pulse uppercase">Incoming {incomingCall.type} Call...</p>
                </div>
              </div>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={handleRejectCall}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-all"
                >
                  Decline
                </button>
                <button 
                  onClick={handleAcceptCall}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-all animate-bounce"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <button 
            onClick={() => setIsHidden(true)}
            className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white border border-slate-700"
            title="Hide Chat"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
