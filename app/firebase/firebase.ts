import {initializeApp, getApps} from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBVgaH3LduEQaKnkc2Zcdry-LxFT91NBDo',
  authDomain: 'loveme-495108.firebaseapp.com',
  projectId: 'loveme-495108',
  storageBucket: 'loveme-495108.firebasestorage.app',
  messagingSenderId: '836083160368',
  appId: '1:836083160368:web:59fc8fdbab5ccdbb1564f5',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

function createAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

function signOutUser() {
  return signOut(auth);
}

function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export {auth, signIn, createAccount, signOutUser as signOut, onAuthChange as onAuthStateChanged};
export type {User};
