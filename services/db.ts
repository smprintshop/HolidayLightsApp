import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, increment, runTransaction, query, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { signInAnonymously, signOut } from 'firebase/auth';
import { db, auth, storage } from './firebase';
import { User, DisplaySubmission, VotingCategory } from '../types';

export const dbService = {
  getCurrentUser: async (userId: string): Promise<User | null> => {
    if (!db) throw new Error("Firestore not initialized");
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  },

  getSubmissions: async (): Promise<DisplaySubmission[]> => {
    if (!db) throw new Error("Firestore not initialized");
    // Only return non-flagged submissions (basic moderation)
    const q = query(collection(db, 'submissions'), where('isFlagged', '!=', true));
    const querySnapshot = await getDocs(q);
    
    // Firestore "where != true" also excludes documents where isFlagged doesn't exist.
    // So we fetch all and filter client side for a small community app or refine query.
    const allSnapshot = await getDocs(collection(db, 'submissions'));
    return allSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as DisplaySubmission))
      .filter(s => !(s as any).isFlagged);
  },

  login: async (email: string): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase services not initialized");
    const authResult = await signInAnonymously(auth);
    const userId = authResult.user.uid;
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const newUser: User = {
        id: userId,
        name: email.split('@')[0],
        email,
        votesRemainingPerAddress: {}
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    return userDoc.data() as User;
  },

  logout: async () => {
    if (auth) await signOut(auth);
  },

  uploadImages: async (submissionId: string, photoDataUrls: string[]): Promise<string[]> => {
    if (!storage) throw new Error("Storage not initialized");
    const uploadPromises = photoDataUrls.map(async (dataUrl, index) => {
      if (dataUrl.startsWith('http')) return dataUrl;
      const storageRef = ref(storage, `submissions/${submissionId}/photo_${index}_${Date.now()}.jpg`);
      await uploadString(storageRef, dataUrl, 'data_url');
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadPromises);
  },

  saveSubmission: async (sub: Omit<DisplaySubmission, 'id'>, photoDataUrls: string[]) => {
    if (!db) throw new Error("Firestore not initialized");
    const subRef = doc(collection(db, 'submissions'));
    const id = subRef.id;
    const uploadedUrls = await dbService.uploadImages(id, photoDataUrls);
    const finalPhotos = uploadedUrls.map((url, i) => ({
      id: `p${i}-${Date.now()}`,
      url,
      isFeatured: i === 0
    }));
    const newSub = { ...sub, id, photos: finalPhotos, isFlagged: false };
    await setDoc(subRef, newSub);
    return newSub as DisplaySubmission;
  },

  updateSubmission: async (id: string, updates: Partial<DisplaySubmission>, photoDataUrls?: string[]) => {
    if (!db) throw new Error("Firestore not initialized");
    let finalUpdates = { ...updates };
    if (photoDataUrls) {
      const uploadedUrls = await dbService.uploadImages(id, photoDataUrls);
      finalUpdates.photos = uploadedUrls.map((url, i) => ({
        id: `p${i}-${Date.now()}`,
        url,
        isFeatured: updates.photos?.[i]?.isFeatured ?? (i === 0)
      }));
    }
    const subRef = doc(db, 'submissions', id);
    await updateDoc(subRef, finalUpdates);
  },

  deleteSubmission: async (id: string) => {
    if (!db || !storage) throw new Error("Firebase not initialized");
    // 1. Delete images from storage
    const folderRef = ref(storage, `submissions/${id}`);
    try {
      const list = await listAll(folderRef);
      await Promise.all(list.items.map(item => deleteObject(item)));
    } catch (e) {
      console.warn("Could not delete storage folder, might be empty", e);
    }
    // 2. Delete document from Firestore
    await deleteDoc(doc(db, 'submissions', id));
  },

  reportSubmission: async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const subRef = doc(db, 'submissions', id);
    await updateDoc(subRef, { isFlagged: true });
  },

  castVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, 'users', userId);
    const subRef = doc(db, 'submissions', submissionId);
    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const subDoc = await transaction.get(subRef);
      if (!userDoc.exists() || !subDoc.exists()) throw "Document missing";
      const userData = userDoc.data() as User;
      const subData = subDoc.data() as DisplaySubmission;
      const votesLeft = userData.votesRemainingPerAddress[submissionId] ?? 10;
      if (votesLeft > 0) {
        const updatedVotesRemaining = { ...userData.votesRemainingPerAddress, [submissionId]: votesLeft - 1 };
        transaction.update(userRef, { votesRemainingPerAddress: updatedVotesRemaining });
        transaction.update(subRef, { [`votes.${category}`]: increment(1), totalVotes: increment(1) });
        return { 
          user: { ...userData, votesRemainingPerAddress: updatedVotesRemaining },
          sub: { ...subData, votes: { ...subData.votes, [category]: (subData.votes[category] || 0) + 1 }, totalVotes: (subData.totalVotes || 0) + 1 }
        };
      }
      return null;
    });
  },

  retractVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, 'users', userId);
    const subRef = doc(db, 'submissions', submissionId);
    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const subDoc = await transaction.get(subRef);
      if (!userDoc.exists() || !subDoc.exists()) throw "Document missing";
      const userData = userDoc.data() as User;
      const subData = subDoc.data() as DisplaySubmission;
      const votesRemaining = userData.votesRemainingPerAddress[submissionId] ?? 10;
      if (votesRemaining < 10 && (subData.votes[category] || 0) > 0) {
        const updatedVotesRemaining = { ...userData.votesRemainingPerAddress, [submissionId]: votesRemaining + 1 };
        transaction.update(userRef, { votesRemainingPerAddress: updatedVotesRemaining });
        transaction.update(subRef, { [`votes.${category}`]: increment(-1), totalVotes: increment(-1) });
        return { 
          user: { ...userData, votesRemainingPerAddress: updatedVotesRemaining },
          sub: { ...subData, votes: { ...subData.votes, [category]: subData.votes[category] - 1 }, totalVotes: subData.totalVotes - 1 }
        };
      }
      return null;
    });
  }
};