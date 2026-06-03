# AGENTS.md

## Project Identity

- **Name:** Eburon AI
- **Repo state:** Greenfield — no code yet. Only the implementation plan in `EBURON_AI_TODO.md` exists. Read that first.
- **Goal:** Android-first React Native/Expo app that bundles the Ollama binary, runs `ollama serve` as a foreground service, authenticates via Firebase, and auto-downloads `eburonmax/eburon-max:latest`.
- **Reference architecture:** [OllamaServer](https://github.com/lovegold120221-dot/OllamaServer) — cloned to `/tmp/ollama-server`. Study its native service pattern, XHR streaming API, and module registration before writing code.

## Tech Stack & Toolchain

- **Framework:** React Native 0.77.1 + Expo 53 (managed via `expo run:android`)
- **Language:** TypeScript 5.0 + Kotlin 2.0.21 (native Android)
- **Auth:** Firebase Auth (project `loveme-495108`), email/password at minimum
- **LLM runtime:** Ollama binary bundled in APK, executed locally via `ProcessBuilder` in Kotlin
- **Model:** `eburonmax/eburon-max:latest` (~1.1 GB)
- **API:** Local HTTP to `http://localhost:11434` via XHR (pull/chat stream) and `fetch` (tags/ps/delete)
- **Package:** `ai.eburon.mobile` (Android), Expo slug `eburon-ai`
- **Node:** >= 18

## Commands

```
expo run:android    # Build & run on connected device / emulator
npx react-native start  # Start Metro bundler separately
npm test            # jest --preset react-native
npm run lint        # eslint .
```

- There is **no `expo start` / Expo Go** — native modules (Foreground Service, Ollama binary) require a dev client build.
- ABIs are split via `android.splits.abi` in `android/app/build.gradle` — only `arm64-v8a` APKs are built by default. No universal APK.

## Reference Architecture (from OllamaServer)

### Native layer (Kotlin)

The app has **5 native modules** registered via `AppReactPackage` (Java):

| Module | JS name | Purpose |
|--------|---------|---------|
| `OllamaServiceModule` | `OllamaServiceModule` | `startService()` / `stopService()` — launches the Android `Service` |
| `OllamaConfigModule` | `OllamaConfigModule` | LAN toggle pref (`getLanListeningEnabled` / `setLanListeningEnabled`) |
| `FileUploadModule` | `FileUploadModule` | Upload model files to Ollama |
| `HashModule` | `HashModule` | Compute SHA-256 digests |
| `LogSaveModule` | `LogSaveModule` | Save Ollama logs to device storage |

**The service launch chain:**
1. JS calls `NativeModules.OllamaServiceModule.startService()`
2. `OllamaService.onStartCommand()` creates `OllamaExecutor(this)`, calls `setupEnvironment()`, then `startOllamaService()`
3. `OllamaExecutor.setupEnvironment()` checks if binary version in `SharedPreferences` matches asset `version.txt`; if not, copies `assets/<abi>/ollama` → `context.filesDir/bin/<abi>/ollama`, sets executable
4. `OllamaExecutor.startOllamaService()` runs `ProcessBuilder(binaryPath, "serve")` with env: `HOME=context.filesDir`, `LD_LIBRARY_PATH=nativeLibDir:...`, `OLLAMA_DEBUG=1`, `OLLAMA_HOST=127.0.0.1` (or `0.0.0.0` if LAN toggle on)
5. Ollama process output is consumed on a background thread and piped to `LogUtils`

**AndroidManifest.xml requires:**
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
<service android:name=".service.OllamaService"
         android:foregroundServiceType="specialUse"
         android:exported="false"/>
```

**MainApplication.kt** must manually add `AppReactPackage()` in `getPackages()` since these are not auto-linked modules.

### JS/TS layer

**API pattern (XHR for streaming, fetch for one-shot):**
- `pull()`, `chat()`, `create()` — return `{ promise, abort() }` with XHR `onprogress` for NDJSON streaming
- `tags()`, `ps()`, `deleteModel()`, `loadModel()` — plain `fetch`
- All requests target `http://localhost:11434/api/...`
- Types are defined in `app/model/` as interfaces (no runtime validation)

**App entry:** `index.js` → `registerRootComponent(App)` from `app/App.tsx`
**Navigation:** `@react-navigation/native-stack` + `@react-navigation/drawer`
**Theme:** Custom `Material3ThemeProvider` context wrapping `react-native-paper`
**i18n:** `i18next` + `react-i18next`, config in `app/i18n/`
**Storage:** `@react-native-async-storage/async-storage` for conversations and pref caching

## Conventions

- **OLLAMA_HOST must always default to `127.0.0.1`.** Never expose Ollama on LAN by default. Any LAN toggle needs a warning and explicit user confirmation.
- **HOME must be set to `context.filesDir`** before launching Ollama so models live in the app sandbox (deleted on uninstall).
- **Authentication gate:** User must sign in before model download starts. No anonymous access, no skipping.
- **Model readiness check:** Always verify with `GET /api/tags` — do not rely solely on AsyncStorage flags.
- **Poll for server readiness** (`Socket` check or `GET /api/version` every 500ms, 30s timeout) instead of fixed `setTimeout` delays.
- **Model pull uses XHR `onprogress`** for streaming NDJSON progress lines — NOT `fetch` with `ReadableStream`.
- **Binary path on device:** `${context.filesDir}/bin/<abi>/ollama` where `<abi>` is `arm64-v8a` or `armeabi-v7a`.
- **Binary versioning:** Semantic version string in `assets/<abi>/version.txt` compared against `SharedPreferences` to decide re-copy.
- **Notification channel:** `EburonAIServiceChannel`, foreground notification uses `NotificationCompat.Builder` with `IMPORTANCE_LOW`.
- **No model picker** — default model is always `eburonmax/eburon-max:latest`. Only expose a picker in advanced/dev mode.
- **No Firebase writes without rules.** Treat Firebase web API key as public config; restrict authorized domains.

## Code Style

- **Prettier:** single quotes, no bracket spaces, trailing commas `all`, `arrowParens: avoid`
- **ESLint:** extends `@react-native`
- **TypeScript:** `tsconfig.json` extends `@react-native/typescript-config/tsconfig.json`
- **Metro:** wraps with `react-native-reanimated/metro-config`
- **Babel:** preset `babel-preset-expo` + plugin `react-native-reanimated/plugin`

## Directory Layout

```
android/app/src/main/java/ai/eburon/mobile/
  MainActivity.kt, MainApplication.kt        # Entry points
  service/EburonOllamaService.kt             # Foreground Service
  utils/OllamaExecutor.kt                    # Binary copy + ProcessBuilder launch
  module/OllamaServiceModule.kt              # Bridge: startService/stopService
  module/OllamaConfigModule.kt               # Bridge: LAN toggle prefs
  reactpkg/AppReactPackage.java              # Registers all native modules
android/app/src/main/assets/arm64-v8a/
  ollama                                      # Bundled binary (~800MB)
  version.txt                                 # Semantic version string
app/
  App.tsx                                     # Root: safe area + theme + navigation
  api/ollama.ts                               # tags, pull, chat wrappers (XHR + fetch)
  api/API.ts                                  # OLLAMA_SERVER constant
  constants/eburon.ts                         # EBURON_MODEL, URLs
  firebase/firebase.ts                        # Firebase init + auth
  auth/AuthProvider.tsx                       # Auth context (user, initializing)
  bootstrap/useEburonBootstrap.ts             # Post-auth: start service → check → pull
  model/                                      # TypeScript interfaces
```

## Key Constraints

- No plain Expo Go — native Foreground Service + binary assets require `expo run:android`.
- Firebase web SDK may need swapping to `@react-native-firebase/app` + `@react-native-firebase/auth` if compatibility issues arise.
- Android permissions required: `INTERNET`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`.
- Model storage path (`data/data/<package>/files`) is wiped on uninstall — plan for re-download.
- `targetSdkVersion` is intentionally low (28 in reference) to avoid Android 10+ scoped-storage restrictions on `filesDir`. Re-evaluate for production.
- The app uses APK ABI splits — only `arm64-v8a` APK generated. Add other ABIs to the `include` block in `build.gradle` if needed.
- `android:usesCleartextTraffic="true"` is required for localhost HTTP calls.
- `android:extractNativeLibs="true"` is set in the manifest.
- Notification update after model download completes must replace the foreground notification, not create a new one.

## Implementation Order (from TODO)

1. Rebrand metadata and UI (Eburon AI naming, logo assets)
2. Wire up Android native Ollama service (copy native module pattern from reference)
3. Add Firebase auth + auth state provider
4. Add Ollama API wrappers (tags, pull, chat — use XHR for streaming)
5. Add post-auth bootstrap hook (start service → check model → pull if needed)
6. Add model progress UI
7. Lock LAN mode off; test on physical arm64 Android device
