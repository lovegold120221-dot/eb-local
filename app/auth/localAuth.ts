import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'eburon_user';

export interface LocalUser {
  email: string;
  name: string;
  createdAt: string;
}

export async function register(
  email: string,
  password: string,
): Promise<LocalUser> {
  const existing = await AsyncStorage.getItem(USER_KEY);
  if (existing) {
    const data = JSON.parse(existing);
    // Simple hash: store password alongside user
    // In production, use a proper hash like bcryptjs or react-native-sha256
    if (data.password) {
      throw new Error('An account already exists on this device.');
    }
  }

  const user: LocalUser & {password: string} = {
    email: email.trim().toLowerCase(),
    name: email.split('@')[0],
    password: await simpleHash(password),
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  const {password: _, ...safeUser} = user;
  return safeUser;
}

export async function login(
  email: string,
  password: string,
): Promise<LocalUser> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) {
    throw new Error('No account found. Create one first.');
  }

  const data = JSON.parse(raw);
  const hashed = await simpleHash(password);

  if (
    data.email !== email.trim().toLowerCase() ||
    data.password !== hashed
  ) {
    throw new Error('Invalid email or password.');
  }

  const {password: _, ...safeUser} = data;
  return safeUser;
}

export async function logout(): Promise<void> {
  // Keep the account on device, just clear session
  // The AuthProvider handles the in-memory state
}

export async function getCurrentUser(): Promise<LocalUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (!data.email) return null;
  const {password: _, ...safeUser} = data;
  return safeUser;
}

export async function hasAccount(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    return !!data.email;
  } catch {
    return false;
  }
}

async function simpleHash(input: string): Promise<string> {
  // Simple hash using built-in crypto-like approach
  // In production, use a proper hashing library
  let hash = 0;
  const salt = 'eburon-local-salt';
  const combined = salt + input;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Convert to hex-like string
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Double-hash for slightly better protection
  let doubleHash = 0;
  for (let i = 0; i < hexHash.length; i++) {
    doubleHash = (doubleHash << 5) - doubleHash + hexHash.charCodeAt(i);
    doubleHash |= 0;
  }
  return Math.abs(doubleHash).toString(16).padStart(8, '0') + hexHash;
}
