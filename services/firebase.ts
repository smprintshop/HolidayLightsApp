
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
// Fix: Separated Firestore value and type imports to resolve potential resolution issues
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// World-class check: Prevent the app from attempting to connect to "YOUR_PROJECT_ID"
export const isFirebaseConfigured = 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" && 
    firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export { auth, db };
export default { auth, db, isFirebaseConfigured };
