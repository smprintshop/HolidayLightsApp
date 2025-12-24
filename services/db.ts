
// Fix: Consolidating modular Firestore imports to ensure consistent resolution of exported members
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { 
  signInAnonymously, 
  signOut 
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from './firebase';
import { User, DisplaySubmission, VotingCategory } from '../types';

// Fallback logic for local development without keys
const LOCAL_STORAGE_KEYS = {
  USER: 'bp_user',
  SUBMISSIONS: 'bp_submissions'
};

const getLocalSubmissions = (): DisplaySubmission[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.SUBMISSIONS);
    return data ? JSON.parse(data) : [];
};

const saveLocalSubmissions = (subs: DisplaySubmission[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
};

export const dbService = {
  getCurrentUser: async (userId: string): Promise<User | null> => {
    if (!isFirebaseConfigured || !db) {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    }
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  },

  getSubmissions: async (): Promise<DisplaySubmission[]> => {
    if (!isFirebaseConfigured || !db) {
      return getLocalSubmissions();
    }
    const querySnapshot = await getDocs(collection(db, 'submissions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisplaySubmission));
  },

  login: async (email: string): Promise<User> => {
    if (!isFirebaseConfigured || !auth || !db) {
      const userId = `local_${Date.now()}`;
      const newUser: User = {
        id: userId,
        name: email.split('@')[0],
        email,
        votesRemainingPerAddress: {}
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    }

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
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    }
  },

  saveSubmission: async (sub: Omit<DisplaySubmission, 'id'>) => {
    if (!isFirebaseConfigured || !db) {
      const subs = getLocalSubmissions();
      const newSub = { ...sub, id: `sub_${Date.now()}` } as DisplaySubmission;
      subs.push(newSub);
      saveLocalSubmissions(subs);
      return newSub;
    }
    const subRef = doc(collection(db, 'submissions'));
    const newSub = { ...sub, id: subRef.id };
    await setDoc(subRef, newSub);
    return newSub as DisplaySubmission;
  },

  updateSubmission: async (id: string, updates: Partial<DisplaySubmission>) => {
    if (!isFirebaseConfigured || !db) {
      const subs = getLocalSubmissions();
      const idx = subs.findIndex(s => s.id === id);
      if (idx !== -1) {
        subs[idx] = { ...subs[idx], ...updates };
        saveLocalSubmissions(subs);
      }
      return;
    }
    const subRef = doc(db, 'submissions', id);
    await updateDoc(subRef, updates);
  },

  castVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    if (!isFirebaseConfigured || !db) {
      const subs = getLocalSubmissions();
      const user = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER) || '{}');
      const subIdx = subs.findIndex(s => s.id === submissionId);
      
      const votesLeft = user.votesRemainingPerAddress[submissionId] ?? 10;
      if (votesLeft > 0 && subIdx !== -1) {
        user.votesRemainingPerAddress[submissionId] = votesLeft - 1;
        subs[subIdx].votes[category] = (subs[subIdx].votes[category] || 0) + 1;
        subs[subIdx].totalVotes = (subs[subIdx].totalVotes || 0) + 1;
        
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
        saveLocalSubmissions(subs);
        return { user, sub: subs[subIdx] };
      }
      return null;
    }

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
        const updatedVotesRemaining = {
          ...userData.votesRemainingPerAddress,
          [submissionId]: votesLeft - 1
        };

        transaction.update(userRef, { votesRemainingPerAddress: updatedVotesRemaining });
        transaction.update(subRef, {
          [`votes.${category}`]: increment(1),
          totalVotes: increment(1)
        });

        return { 
          user: { ...userData, votesRemainingPerAddress: updatedVotesRemaining },
          sub: { 
            ...subData, 
            votes: { ...subData.votes, [category]: (subData.votes[category] || 0) + 1 },
            totalVotes: (subData.totalVotes || 0) + 1
          }
        };
      }
      return null;
    });
  },

  retractVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    if (!isFirebaseConfigured || !db) {
        const subs = getLocalSubmissions();
        const user = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER) || '{}');
        const subIdx = subs.findIndex(s => s.id === submissionId);
        
        const votesRemaining = user.votesRemainingPerAddress[submissionId] ?? 10;
        if (votesRemaining < 10 && subIdx !== -1 && (subs[subIdx].votes[category] || 0) > 0) {
          user.votesRemainingPerAddress[submissionId] = votesRemaining + 1;
          subs[subIdx].votes[category] = subs[subIdx].votes[category] - 1;
          subs[subIdx].totalVotes = subs[subIdx].totalVotes - 1;
          
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
          saveLocalSubmissions(subs);
          return { user, sub: subs[subIdx] };
        }
        return null;
    }

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
        const updatedVotesRemaining = {
          ...userData.votesRemainingPerAddress,
          [submissionId]: votesRemaining + 1
        };

        transaction.update(userRef, { votesRemainingPerAddress: updatedVotesRemaining });
        transaction.update(subRef, {
          [`votes.${category}`]: increment(-1),
          totalVotes: increment(-1)
        });

        return { 
          user: { ...userData, votesRemainingPerAddress: updatedVotesRemaining },
          sub: { 
            ...subData, 
            votes: { ...subData.votes, [category]: subData.votes[category] - 1 },
            totalVotes: subData.totalVotes - 1
          }
        };
      }
      return null;
    });
  }
};
