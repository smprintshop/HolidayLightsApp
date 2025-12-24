
import { User, DisplaySubmission, VotingCategory } from '../types';

const DB_NAME = 'HolidayLightsDB';
const DB_VERSION = 1;
const USERS_KEY = 'holiday_lights_users';
const AUTH_KEY = 'holiday_lights_auth';
const SUBMISSIONS_STORE = 'submissions';

// Helper to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SUBMISSIONS_STORE)) {
        db.createObjectStore(SUBMISSIONS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const dbService = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  getCurrentUser: (): User | null => {
    const userId = localStorage.getItem(AUTH_KEY);
    if (!userId) return null;
    return dbService.getUsers().find(u => u.id === userId) || null;
  },

  getSubmissions: async (): Promise<DisplaySubmission[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SUBMISSIONS_STORE, 'readonly');
      const store = transaction.objectStore(SUBMISSIONS_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  },

  login: (email: string): User => {
    const users = dbService.getUsers();
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email,
        votesRemainingPerAddress: {}
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    localStorage.setItem(AUTH_KEY, user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  saveSubmission: async (sub: Omit<DisplaySubmission, 'id'>) => {
    const db = await openDB();
    const newSub = { ...sub, id: 's-' + Date.now() };
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SUBMISSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SUBMISSIONS_STORE);
      const request = store.put(newSub);
      request.onsuccess = () => resolve(newSub);
      request.onerror = () => reject(request.error);
    });
  },

  updateSubmission: async (id: string, updates: Partial<DisplaySubmission>) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SUBMISSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SUBMISSIONS_STORE);
      const getReq = store.get(id);
      
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing) {
          const updated = { ...existing, ...updates };
          store.put(updated);
          resolve(updated);
        } else {
          reject('Submission not found');
        }
      };
    });
  },

  castVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    const users = dbService.getUsers();
    const user = users.find(u => u.id === userId);
    const db = await openDB();

    if (user) {
      const votesLeft = user.votesRemainingPerAddress[submissionId] ?? 10;
      if (votesLeft > 0) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(SUBMISSIONS_STORE, 'readwrite');
          const store = transaction.objectStore(SUBMISSIONS_STORE);
          const getReq = store.get(submissionId);

          getReq.onsuccess = () => {
            const sub = getReq.result;
            if (sub) {
              user.votesRemainingPerAddress[submissionId] = votesLeft - 1;
              sub.votes[category] = (sub.votes[category] || 0) + 1;
              sub.totalVotes = (sub.totalVotes || 0) + 1;
              
              store.put(sub);
              localStorage.setItem(USERS_KEY, JSON.stringify(users));
              resolve({ user, sub });
            } else {
              reject('Sub not found');
            }
          };
        });
      }
    }
    return null;
  },

  retractVote: async (userId: string, submissionId: string, category: VotingCategory) => {
    const users = dbService.getUsers();
    const user = users.find(u => u.id === userId);
    const db = await openDB();

    if (user) {
      const votesRemaining = user.votesRemainingPerAddress[submissionId] ?? 10;
      if (votesRemaining < 10) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(SUBMISSIONS_STORE, 'readwrite');
          const store = transaction.objectStore(SUBMISSIONS_STORE);
          const getReq = store.get(submissionId);

          getReq.onsuccess = () => {
            const sub = getReq.result;
            if (sub && (sub.votes[category] || 0) > 0) {
              user.votesRemainingPerAddress[submissionId] = votesRemaining + 1;
              sub.votes[category] = sub.votes[category] - 1;
              sub.totalVotes = (sub.totalVotes || 0) - 1;
              
              store.put(sub);
              localStorage.setItem(USERS_KEY, JSON.stringify(users));
              resolve({ user, sub });
            } else {
              resolve(null);
            }
          };
        });
      }
    }
    return null;
  }
};
