import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Current Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0Po3Hs59YPVi_PtTwRdYZX2SsBZFeyZw",
  authDomain: "holiday-lights-app.firebaseapp.com",
  projectId: "holiday-lights-app",
  storageBucket: "holiday-lights-app.firebasestorage.app",
  messagingSenderId: "386079586322",
  appId: "1:386079586322:web:6f40abf0655eda509f40cb",
  measurementId: "G-DZ75S4EQEH"
};

/**
 * Ensures we have valid Firebase credentials before initializing.
 */
export const isFirebaseConfigured = 
    !!firebaseConfig.projectId && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    !!firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export { auth, db, storage };
export default { auth, db, storage, isFirebaseConfigured };