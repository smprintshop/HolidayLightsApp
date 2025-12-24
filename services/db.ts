
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  increment, 
  query, 
  where,
  runTransaction
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { User, DisplaySubmission, VotingCategory } from '../types';

export const dbService = {
  getCurrentUser: async (userId: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  },

  getSubmissions: async (): Promise<DisplaySubmission[]> => {
    const querySnapshot = await getDocs(collection(db, 'submissions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisplaySubmission));
  },

  login: async (email: string): Promise<User> => {
    // For simplicity in this demo, we use anonymous auth but tag with email
    // In a real app, use sendSignInLinkToEmail or signInWithPassword
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
    await signOut(auth);
  },

  saveSubmission: async (sub: Omit<DisplaySubmission, 'id'>) => {
    const subRef = doc(collection(db, 'submissions'));
    const newSub = { ...sub, id: subRef.id };
    await setDoc(subRef, newSub);
    return newSub;
  },

  updateSubmission: async (id: string, updates: Partial<DisplaySubmission>) => {
    const subRef = doc(db, 'submissions', id);
    await updateDoc(subRef, updates);
  },

  castVote: async (userId: string, submissionId: string, category: VotingCategory) => {
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
