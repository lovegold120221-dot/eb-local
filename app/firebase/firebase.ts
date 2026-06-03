import {initializeApp, getApps, getApp} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyBVgaH3LduEQaKnkc2Zcdry-LxFT91NBDo',
  authDomain: 'loveme-495108.firebaseapp.com',
  projectId: 'loveme-495108',
  storageBucket: 'loveme-495108.firebasestorage.app',
  messagingSenderId: '836083160368',
  appId: '1:836083160368:web:59fc8fdbab5ccdbb1564f5',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
};
export type {User};
