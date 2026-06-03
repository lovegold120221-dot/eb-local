# TODO: Eburon AI Mobile App - Local Ollama + Firebase Auth

Goal: Build an Android-first React Native/Expo app branded as Eburon AI that mimics the OllamaServer architecture: bundle the Android Ollama binary inside the APK, copy it to app-private storage, run `ollama serve` as a foreground service, authenticate the user with Firebase, then automatically download the Eburon model after successful authentication.

Primary model: `eburonmax/eburon-max:latest`
Logo source: `https://eburon.ai/icon-eburon.svg`
Firebase project config: `loveme-495108`

---

## 0. Product rules and acceptance criteria

- [ ] App display name is `Eburon AI`.
- [ ] App icon, splash screen, login screen, server notification, and loading states use Eburon branding.
- [ ] User must authenticate before the model download starts.
- [ ] After successful authentication, app starts the local Ollama service if it is not running.
- [ ] After the local service is ready, app checks whether `eburonmax/eburon-max:latest` is already installed.
- [ ] If the model is not installed, app pulls it through the local Ollama API at `POST http://localhost:11434/api/pull`.
- [ ] Download progress is visible and resumable/cancellable where possible.
- [ ] App does not expose Ollama on LAN by default; `OLLAMA_HOST` defaults to `127.0.0.1`.
- [ ] App stores model data inside the app sandbox by setting `HOME` to `context.filesDir` before launching Ollama.
- [ ] App can chat with `eburonmax/eburon-max:latest` through `POST /api/chat` after the model is ready.

---

## 1. Fork and baseline cleanup

- [ ] Fork or clone the existing OllamaServer-style app.
- [ ] Rename the project from OllamaServer to Eburon AI.
- [ ] Rename package IDs consistently:
  - Android package example: `ai.eburon.mobile`
  - Kotlin namespace example: `ai.eburon.mobile`
  - Expo slug example: `eburon-ai`
- [ ] Update app metadata:
  - `app.json` or `app.config.js`
  - `package.json`
  - Android `strings.xml`
  - Android notification title/body strings
- [ ] Keep the existing native Ollama execution pattern:
  - Android asset contains `ollama` binary.
  - Kotlin copies binary to app-private storage.
  - Kotlin marks binary executable.
  - Kotlin launches `ollama serve` with `ProcessBuilder`.
  - React Native talks to local Ollama over HTTP.

---

## 2. Branding tasks

- [ ] Download the SVG logo:

```bash
curl -L "https://eburon.ai/icon-eburon.svg" -o assets/branding/icon-eburon.svg
```

- [ ] Convert the SVG to PNG assets required by Expo/Android:
  - `assets/images/icon.png` - 1024 x 1024
  - `assets/images/adaptive-icon.png` - 1024 x 1024
  - `assets/images/splash-icon.png` - PNG, transparent background recommended
  - `assets/images/favicon.png` - if web target is kept
- [ ] Update Expo config:

```json
{
  "expo": {
    "name": "Eburon AI",
    "slug": "eburon-ai",
    "icon": "./assets/images/icon.png",
    "android": {
      "package": "ai.eburon.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#000000"
      }
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "backgroundColor": "#000000",
          "imageWidth": 200
        }
      ]
    ]
  }
}
```

- [ ] Replace legacy Ollama UI copy with Eburon AI copy:
  - Login headline: `Welcome to Eburon AI`
  - Download title: `Setting up Eburon Max`
  - Model ready state: `Eburon Max is ready`
  - Foreground notification title: `Eburon AI is running locally`
  - Foreground notification body: `Local AI service active on this device`

---

## 3. Firebase authentication setup

- [ ] Install Firebase JS SDK if using the provided web config directly:

```bash
npm install firebase @react-native-async-storage/async-storage
```

- [ ] Create `app/firebase/firebase.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
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

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
};
export type { User };
```

- [ ] If this import fails in your Expo/Firebase version, switch to React Native Firebase instead:
  - Install `@react-native-firebase/app` and `@react-native-firebase/auth`.
  - Add native Firebase files from the Firebase Console:
    - Android: `google-services.json`
    - iOS if needed later: `GoogleService-Info.plist`
  - Rebuild the development app; this cannot run inside plain Expo Go.
- [ ] Add Firebase Authentication providers in Firebase Console:
  - Email/password at minimum.
  - Google sign-in optional.
- [ ] Add security hardening:
  - Restrict authorized domains.
  - Enable App Check later if backend or database calls are added.
  - Do not use Firestore/Storage rules that allow public writes.

---

## 4. Authentication-gated app flow

- [ ] Create app-level auth state provider:

```ts
// app/auth/AuthProvider.tsx
import React, { createContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User } from '../firebase/firebase';

export const AuthContext = createContext<{
  user: User | null;
  initializing: boolean;
}>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] App navigation rule:
  - `initializing === true`: show Eburon splash/loading screen.
  - `user === null`: show login/register screen.
  - `user !== null`: show model bootstrap screen until Eburon Max is ready.
  - model ready: show chat/home screen.

---

## 5. Native Ollama service tasks

- [ ] Keep Android permissions:
  - `android.permission.INTERNET`
  - `android.permission.FOREGROUND_SERVICE`
  - Android 14+: appropriate foreground service type permission if used.
- [ ] Keep native service class pattern:
  - `EburonOllamaService.kt` extends Android `Service`.
  - `onStartCommand()` creates executor, calls setup, starts `ollama serve`, then calls `startForeground()`.
- [ ] Keep executor pattern:
  - Detect supported ABI, prioritizing `arm64-v8a`.
  - Read asset version from `assets/<abi>/version.txt`.
  - Copy `assets/<abi>/ollama` to `context.filesDir/bin/<abi>/ollama` if missing or outdated.
  - Call `setExecutable(true)` on copied binary.
  - Launch with `ProcessBuilder(binaryPath, "serve")`.
  - Set environment:

```text
HOME=<context.filesDir>
LD_LIBRARY_PATH=<native lib dir plus existing path>
OLLAMA_DEBUG=1
OLLAMA_HOST=127.0.0.1
```

- [ ] Do not enable LAN listening by default.
- [ ] If a LAN toggle is kept, put it behind a clear warning because `OLLAMA_HOST=0.0.0.0` exposes the local Ollama API to the network.
- [ ] Rename notification channel:
  - Channel ID: `EburonAIServiceChannel`
  - Title: `Eburon AI is running locally`
  - Body: `Local AI service active on this device`
  - Small icon: Eburon monochrome drawable.

---

## 6. Ollama API wrapper tasks

- [ ] Create constants:

```ts
// app/constants/eburon.ts
export const OLLAMA_SERVER = 'http://localhost:11434';
export const EBURON_MODEL = 'eburonmax/eburon-max:latest';
export const EBURON_MODEL_FALLBACK_NAME = 'eburonmax/eburon-max';
export const EBURON_LOGO_URL = 'https://eburon.ai/icon-eburon.svg';
```

- [ ] Implement `tags()` to list local models:

```ts
export async function tags() {
  const res = await fetch(`${OLLAMA_SERVER}/api/tags`);
  if (!res.ok) throw new Error(`Failed to list models: ${res.status}`);
  return res.json();
}
```

- [ ] Implement model installed check:

```ts
import { EBURON_MODEL, EBURON_MODEL_FALLBACK_NAME } from '../constants/eburon';

export async function isEburonModelInstalled(): Promise<boolean> {
  const data = await tags();
  return Boolean(
    data.models?.some((m: { name: string }) =>
      m.name === EBURON_MODEL ||
      m.name === EBURON_MODEL_FALLBACK_NAME ||
      m.name.startsWith(`${EBURON_MODEL_FALLBACK_NAME}:`)
    )
  );
}
```

- [ ] Keep the existing XHR-based `pull()` pattern for streaming progress:

```ts
export type PullResponse = {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
};

export function pullModel(
  modelName: string,
  onProgress: (response: PullResponse) => void,
) {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    let buffer = '';
    xhr.open('POST', `${OLLAMA_SERVER}/api/pull`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = () => {
      const chunk = xhr.responseText.substring(buffer.length);
      buffer += chunk;

      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          onProgress(JSON.parse(trimmed));
        } catch {
          // Ignore incomplete JSON line; next progress event may complete it.
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Pull failed: ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Network error while pulling model'));
    xhr.onabort = () => reject(new Error('Model pull aborted'));

    xhr.send(JSON.stringify({ model: modelName, stream: true }));
  });

  return {
    promise,
    abort: () => xhr.abort(),
  };
}
```

---

## 7. Auto-download after Firebase authentication

- [ ] Create `app/bootstrap/useEburonBootstrap.ts`:

```ts
import { useEffect, useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EBURON_MODEL } from '../constants/eburon';
import { isEburonModelInstalled, pullModel, PullResponse } from '../api/ollama';
import type { User } from '../firebase/firebase';

const { OllamaServiceModule } = NativeModules;

type BootstrapStatus =
  | 'idle'
  | 'starting-service'
  | 'checking-model'
  | 'downloading-model'
  | 'ready'
  | 'error';

export function useEburonBootstrap(user: User | null) {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!user || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const storageKey = `eburon-model-ready:${user.uid}:${EBURON_MODEL}`;

    async function run() {
      try {
        setStatus('starting-service');
        setMessage('Starting local Eburon AI service...');
        await OllamaServiceModule.startService();

        // Give the local server a short readiness window in real implementation.
        // Prefer replacing this with a poll to GET /api/version.
        await new Promise(resolve => setTimeout(resolve, 2000));

        setStatus('checking-model');
        setMessage('Checking Eburon Max model...');
        const installed = await isEburonModelInstalled();
        if (installed) {
          await AsyncStorage.setItem(storageKey, 'true');
          setStatus('ready');
          setProgress(1);
          setMessage('Eburon Max is ready.');
          return;
        }

        setStatus('downloading-model');
        setMessage('Downloading Eburon Max...');

        const session = pullModel(EBURON_MODEL, (r: PullResponse) => {
          setMessage(r.status || 'Downloading Eburon Max...');
          if (typeof r.completed === 'number' && typeof r.total === 'number' && r.total > 0) {
            setProgress(r.completed / r.total);
          }
        });

        await session.promise;
        await AsyncStorage.setItem(storageKey, 'true');
        setStatus('ready');
        setProgress(1);
        setMessage('Eburon Max is ready.');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    }

    run();
  }, [user]);

  return { status, progress, message, error };
}
```

- [ ] Replace fixed delay with proper server readiness polling:
  - Poll `GET http://localhost:11434/api/version` every 500 ms.
  - Stop after 30 seconds and show retry UI.
- [ ] Do not rely only on AsyncStorage to decide readiness; always verify with `/api/tags`.
- [ ] Add retry button on failure:
  - Restart service.
  - Re-check model.
  - Resume pull if possible.

---

## 8. Bootstrap UI tasks

- [ ] Create `EburonBootstrapScreen.tsx`.
- [ ] Screen states:
  - Starting local service
  - Checking model
  - Downloading model with progress bar
  - Ready
  - Error with retry
- [ ] Recommended copy:
  - `Preparing Eburon AI on this device`
  - `Starting secure local AI runtime...`
  - `Downloading Eburon Max. Keep the app open.`
  - `This is a one-time setup. The model is stored locally on your device.`
- [ ] Show network/storage warning before or during download:
  - Model is around 1.1GB.
  - Recommend Wi-Fi.
  - Recommend charging if battery is low.
- [ ] Optional: Add setting `Auto-download on sign-in` default enabled.

---

## 9. Chat flow tasks

- [ ] Default selected model is always `eburonmax/eburon-max:latest`.
- [ ] Hide generic public model picker unless you want advanced mode.
- [ ] Implement chat call:

```ts
export async function chatWithEburon(messages: Array<{ role: string; content: string }>) {
  const res = await fetch(`${OLLAMA_SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'eburonmax/eburon-max:latest',
      messages,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res;
}
```

- [ ] On app launch after login:
  - Start service.
  - Check model exists.
  - Load or warm model optionally via `/api/chat` with `keep_alive`.

---

## 10. Android build and binary packaging tasks

- [ ] Keep assets layout:

```text
android/app/src/main/assets/arm64-v8a/ollama
android/app/src/main/assets/arm64-v8a/version.txt
```

- [ ] Verify binary executes on target Android devices:
  - arm64-v8a devices first.
  - Add other ABIs only if compatible Ollama binaries exist.
- [ ] Verify app-private binary path after first launch:

```text
/data/data/<package>/files/bin/arm64-v8a/ollama
```

- [ ] Verify model storage path is under app sandbox due to `HOME=context.filesDir`.
- [ ] Test uninstall/reinstall behavior:
  - Uninstall should remove downloaded model.
  - Reinstall should require model pull again.
- [ ] Test Android 13/14 foreground service restrictions and notifications.

---

## 11. Security and privacy tasks

- [ ] Keep local Ollama bound to `127.0.0.1` by default.
- [ ] Do not expose `/api/pull`, `/api/delete`, `/api/create`, or `/api/chat` over LAN without an explicit user-controlled toggle.
- [ ] If LAN mode is added, show visible warning and require confirmation.
- [ ] Keep downloaded models in app-private storage.
- [ ] Avoid sending user prompts to Firebase unless analytics/history is explicitly required.
- [ ] Make clear in privacy copy that model inference runs locally on the device.
- [ ] Add Firebase rules before adding Firestore/Storage.
- [ ] Treat the Firebase web API key as public client config, but still restrict domains and app usage where possible.

---

## 12. Testing matrix

- [ ] Fresh install, no auth: login screen only; no model download.
- [ ] Successful auth: local service starts automatically.
- [ ] Successful auth plus missing model: app starts model pull.
- [ ] Existing model: app skips download and enters chat.
- [ ] Interrupted download: app can retry/resume.
- [ ] No internet: app shows clear offline state.
- [ ] Low storage: app shows storage error and retry guidance.
- [ ] App backgrounded during setup: foreground notification remains accurate.
- [ ] Logout: app does not delete local model by default unless requested.
- [ ] Uninstall: model removed with app sandbox.
- [ ] LAN mode off: no external device can access port 11434.

---

## 13. Implementation order

1. Rebrand app metadata and UI to Eburon AI.
2. Add logo assets and splash/icon config.
3. Keep and rename Android native Ollama service/executor.
4. Add Firebase auth screen and auth state provider.
5. Add Eburon constants and Ollama API wrapper.
6. Add post-auth bootstrap hook.
7. Add model progress UI.
8. Set default model to `eburonmax/eburon-max:latest`.
9. Lock LAN mode off by default.
10. Build APK/AAB and test on physical arm64 Android device.

---

## 14. Key references

- Eburon logo: `https://eburon.ai/icon-eburon.svg`
- Eburon website: `https://eburon.ai/`
- Eburon Ollama model: `https://ollama.com/eburonmax/eburon-max:latest`
- Ollama pull endpoint: `POST /api/pull`
- Local Ollama base URL: `http://localhost:11434`
