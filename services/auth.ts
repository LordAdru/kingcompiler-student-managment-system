
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
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
  getDocs,
  setDoc,
  collection,
  query,
  where
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { auth, db } from './firebase';
import { AppUser, UserRole, Student } from '../types';

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
        const studentQuery = query(collection(db, 'students'), where('email', '==', email.toLowerCase()));
        const studentSnap = await getDocs(studentQuery);
        
        let role: UserRole = isAdminEmail ? 'admin' : 'collaborator';
        let studentId: string | undefined = undefined;

        if (!isAdminEmail && !studentSnap.empty) {
          role = 'student';
          studentId = studentSnap.docs[0].id;
        }

        const newUser: AppUser = {
          uid: user.uid,
          email: user.email,
          role,
          displayName: user.email?.split('@')[0],
          studentId
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

  adminCreateUserAccount: async (email: string, password: string, displayName: string, role: UserRole, studentId?: string): Promise<string> => {
    const tempAppName = `temp-app-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        email: email.toLowerCase(),
        displayName,
        role,
        studentId: studentId || null
      });

      await tempAuth.signOut();
      await deleteApp(tempApp);

      return uid;
    } catch (error: any) {
      await deleteApp(tempApp);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. If you need to update the password, please use the reset option.');
      }
      throw new Error(error.message || 'Failed to create user credentials.');
    }
  },

  sendResetEmail: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
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
            const studentQuery = query(collection(db, 'students'), where('email', '==', user.email?.toLowerCase()));
            const studentSnap = await getDocs(studentQuery);
            
            callback({
              uid: user.uid,
              email: user.email,
              role: isAdminEmail ? 'admin' : (!studentSnap.empty ? 'student' : 'collaborator'),
              studentId: !studentSnap.empty ? studentSnap.docs[0].id : undefined,
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
