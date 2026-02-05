
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth,
  User 
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  initializeApp,
  deleteApp
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  doc, 
  getDoc,
  setDoc 
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '../types';

// We need the config to initialize a secondary app for admin-level user creation
const firebaseConfig = {
  apiKey: "AIzaSyBQZxatyfbgQCcZdAFIV2ucanowLuIZhn8",
  authDomain: "kingcompiler-academy-manager.firebaseapp.com",
  projectId: "kingcompiler-academy-manager",
  storageBucket: "kingcompiler-academy-manager.firebasestorage.app",
  messagingSenderId: "1090473289859",
  appId: "1:1090473289859:web:d0d7f1a9f51987a9c453b6"
};

export const authService = {
  signIn: async (email: string, password: string): Promise<AppUser> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const isAdminEmail = user.email?.toLowerCase() === 'kingcompiler.official@gmail.com';
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        const role: UserRole = isAdminEmail ? 'admin' : 'collaborator';
        const newUser: AppUser = {
          uid: user.uid,
          email: user.email,
          role,
          displayName: user.email?.split('@')[0]
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        return newUser;
      }

      const existingUser = userDoc.data() as AppUser;
      if (isAdminEmail) {
        existingUser.role = 'admin';
      }
      return existingUser;
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed.');
    }
  },

  /**
   * High-level Admin Tool: Creates a partner account without logging out the admin.
   * Uses a temporary secondary Firebase app instance.
   */
  adminCreatePartnerAccount: async (email: string, password: string, displayName: string): Promise<string> => {
    const tempAppName = `temp-app-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const uid = userCredential.user.uid;

      // Initialize Firestore entry
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        role: 'collaborator'
      });

      // Sign out and destroy the temporary app immediately
      await tempAuth.signOut();
      await deleteApp(tempApp);

      return uid;
    } catch (error: any) {
      // Cleanup even on error
      await deleteApp(tempApp);
      throw new Error(error.message || 'Failed to create partner credentials.');
    }
  },

  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  onAuthStateChange: (callback: (user: AppUser | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const isAdminEmail = user.email?.toLowerCase() === 'kingcompiler.official@gmail.com';
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data() as AppUser;
            if (isAdminEmail) data.role = 'admin';
            callback(data);
          } else {
            callback({
              uid: user.uid,
              email: user.email,
              role: isAdminEmail ? 'admin' : 'collaborator',
              displayName: user.email?.split('@')[0]
            });
          }
        } catch (e) {
          callback({
            uid: user.uid,
            email: user.email,
            role: user.email?.toLowerCase() === 'kingcompiler.official@gmail.com' ? 'admin' : 'collaborator'
          });
        }
      } else {
        callback(null);
      }
    });
  }
};
