import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

export {auth};
export type User = FirebaseAuthTypes.User;

export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

export function signIn(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export function createAccount(email: string, password: string) {
  return auth().createUserWithEmailAndPassword(email, password);
}

export function signOut() {
  return auth().signOut();
}
