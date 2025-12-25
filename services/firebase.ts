
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
// Fix: Separated Firestore value and type imports to resolve potential resolution issues
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0Po3Hs59YPVi_PtTwRdYZX2SsBZFeyZw",
  authDomain: "holiday-lights-app.firebaseapp.com",
  projectId: "holiday-lights-app",
  storageBucket: "holiday-lights-app.firebasestorage.app",
  messagingSenderId: "386079586322",
  appId: "1:386079586322:web:6f40abf0655eda509f40cb",
};

// World-class check: Prevent the app from attempting to connect to "YOUR_PROJECT_ID"
export const isFirebaseConfigured = 
    firebaseConfig.projectId !== "holiday-lights-app" && 
    firebaseConfig.apiKey !== "aSyB0Po3Hs59YPVi_PtTwRdYZX2SsBZFeyZw";

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
