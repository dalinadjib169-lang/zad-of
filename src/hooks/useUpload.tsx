import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { playSound } from '../lib/sounds';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Temporary public ImgBB API key for the demo
const IMGBB_API_KEY = '7026723e746532454593498305094326';

interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  type: 'post' | 'product' | 'profile' | 'message';
}

interface UploadContextType {
  activeUploads: UploadTask[];
  startUpload: (file: File, type: 'post' | 'product' | 'profile' | 'message', data: any) => Promise<void>;
  removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [activeUploads, setActiveUploads] = useState<UploadTask[]>([]);

  const removeUpload = useCallback((id: string) => {
    setActiveUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const startUpload = useCallback(async (file: File, type: 'post' | 'product' | 'profile' | 'message', data: any) => {
    const id = Math.random().toString(36).substring(7);
    const fileName = file.name;

    setActiveUploads(prev => [...prev, { id, fileName, progress: 0, status: 'uploading', type }]);

    // Use Firebase Storage for audio/video or if ImgBB fails
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      try {
        const storageRef = ref(storage, `chats/${id}_${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u));
          }, 
          (error) => {
            console.error("Firebase Storage Upload Error:", error);
            setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u));
            setTimeout(() => removeUpload(id), 10000);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            let firestoreSuccess = false;

            if (type === 'message') {
              try {
                await addDoc(collection(db, 'messages'), {
                  ...data,
                  [file.type.startsWith('audio/') ? 'audioUrl' : 'videoUrl']: downloadURL,
                  createdAt: serverTimestamp(),
                  seen: false
                });
                playSound('message');
                firestoreSuccess = true;
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, 'messages');
              }
            } else if (type === 'post') {
              try {
                await addDoc(collection(db, 'posts'), {
                  ...data,
                  imageUrl: '',
                  videoUrl: downloadURL,
                  createdAt: serverTimestamp(),
                });
                playSound('post');
                firestoreSuccess = true;
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, 'posts');
              }
            }

            if (firestoreSuccess) {
              setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'completed', progress: 100 } : u));
              setTimeout(() => removeUpload(id), 5000);
            }
          }
        );
        return;
      } catch (err) {
        console.error("Upload setup error:", err);
        setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u));
        return;
      }
    }

    try {
      console.log(`Starting ImgBB upload for ${fileName}...`);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u));
        }
      });

      if (response.data && response.data.data && response.data.data.url) {
        const downloadURL = response.data.data.url;
        console.log(`Upload successful: ${downloadURL}`);

        let firestoreSuccess = false;

        if (type === 'post') {
          try {
            await addDoc(collection(db, 'posts'), {
              ...data,
              imageUrl: downloadURL,
              videoUrl: '', 
              createdAt: serverTimestamp(),
            });
            playSound('post');
            firestoreSuccess = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'posts');
          }
        } else if (type === 'product') {
          const { productId, totalImages } = data;
          const productRef = doc(db, 'products', productId);
          
          try {
            await updateDoc(productRef, {
              images: arrayUnion(downloadURL)
            });

            const updatedDoc = await getDoc(productRef);
            const currentImages = updatedDoc.data()?.images || [];
            
            if (currentImages.length >= totalImages) {
              await updateDoc(productRef, {
                status: 'available'
              });
            }
            firestoreSuccess = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
          }
        } else if (type === 'profile') {
          const userRef = doc(db, 'users', data.uid);
          try {
            await updateDoc(userRef, {
              photoURL: downloadURL
            });
            firestoreSuccess = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${data.uid}`);
          }
        } else if (type === 'message') {
          try {
            await addDoc(collection(db, 'messages'), {
              ...data,
              imageUrl: downloadURL,
              createdAt: serverTimestamp(),
              seen: false
            });
            playSound('message');
            firestoreSuccess = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'messages');
          }
        }

        if (firestoreSuccess) {
          setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'completed', progress: 100 } : u));
          setTimeout(() => removeUpload(id), 5000);
        } else {
          throw new Error("Firestore write failed after successful image upload.");
        }
      } else {
        throw new Error("Invalid response from ImgBB");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u));
      setTimeout(() => removeUpload(id), 10000);
    }
  }, [removeUpload]);

  return (
    <UploadContext.Provider value={{ activeUploads, startUpload, removeUpload }}>
      {children}
      
      {/* Global Upload Progress UI */}
      <div className="fixed bottom-24 left-8 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {activeUploads.map(upload => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl w-64 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {upload.status === 'uploading' && <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />}
                  {upload.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {upload.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                  <span className="text-[10px] font-black text-slate-400 uppercase truncate max-w-[120px]">{upload.fileName}</span>
                </div>
                <span className="text-[10px] font-black text-purple-400">{Math.round(upload.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${upload.status === 'error' ? 'bg-red-500' : 'bg-purple-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.status === 'completed' && (
                <p className="text-[10px] font-bold text-green-500 mt-2">Upload complete! ✨</p>
              )}
              {upload.status === 'error' && (
                <p className="text-[10px] font-bold text-red-500 mt-2">Upload failed. Try again.</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
