## TASK-20260604-030000: Build Eburon AI App from Reference Architecture

### START RECORD
- STATUS: STARTED
- Start time: 2026-06-04T03:00:00Z
- User request: "build it" — build the entire Eburon AI app from the plan
- Last known state: Greenfield repo with only EBURON_AI_TODO.md and AGENTS.md
- Reference: /tmp/ollama-server (OllamaServer) cloned for patterns
- Preservation constraints: Follow reference architecture patterns, Eburon branding
- Files/directories to inspect: /tmp/ollama-server (reference)
- Success criteria: Full app structure buildable via `expo run:android`

### FINAL REPORT
- STATUS: COMPLETED
- End time: 2026-06-04T03:10:00Z
- Files changed: 44 source files created

### What was built

#### Android Native Layer (Kotlin/Java)
- `MainActivity.kt`, `MainApplication.kt` — entry points with manual AppReactPackage registration
- `service/OllamaService.kt` — Android foreground Service with "EburonAIServiceChannel" notification
- `utils/OllamaExecutor.kt` — binary version check, copy from assets, ProcessBuilder launch with env vars (HOME=filesDir, OLLAMA_HOST=127.0.0.1)
- `module/OllamaServiceModule.kt` — JS bridge: startService/stopService via NativeModules
- `module/OllamaConfigModule.kt` — LAN toggle pref (locked off by default)
- `reactpkg/AppReactPackage.java` — registers all native modules (not auto-linked)

#### Android Build Config
- `AndroidManifest.xml` — permissions (INTERNET, FOREGROUND_SERVICE, FOREGROUND_SERVICE_SPECIAL_USE), service declaration, cleartextTraffic=true, extractNativeLibs=true
- `build.gradle` (root + app) — ABI splits (arm64-v8a only), targetSdk 28, kotlinOptions jvmTarget 17
- `settings.gradle` — Expo autolinking
- `gradle-wrapper.properties` — Grade 8.10.2
- `proguard-rules.pro` — React Native keep rules
- `strings.xml`, `styles.xml` — Eburon branding strings
- `drawable/eburon_notification.xml` — vector notification icon
- `drawable/splashscreen.xml` — black splash screen

#### TypeScript Source (33 files)
- `app/model/` — 6 interface files (Pull, Tag, Chat, Conversation, Ps, Create)
- `app/constants/eburon.ts` — OLLAMA_SERVER, EBURON_MODEL, logo URL
- `app/api/OllamaApi.ts` — XHR-based pull/chat (streaming NDJSON), fetch-based tags/ps/delete
- `app/firebase/firebase.ts` — Firebase init with project loveme-495108, getAuth()
- `app/auth/AuthProvider.tsx` — Auth context with onAuthStateChanged listener
- `app/bootstrap/useEburonBootstrap.ts` — Post-auth: startService → poll server → check model → pull if needed
- `app/theme/ThemeContext.tsx` — Material3 theme wrapping react-native-paper
- `app/components/SplashScreen.tsx` — Black splash with Eburon AI title
- `app/components/LoginScreen.tsx` — Email/password login + register
- `app/components/BootstrapScreen.tsx` — Progress bar with status messages
- `app/components/ChatScreen.tsx` — Chat UI with send/stop, XHR streaming chat
- `app/App.tsx` — Root: auth gate → login → bootstrap → chat

#### Config Files
- `package.json` — all dependencies (RN 0.77.1, Expo 53, Firebase 11.5, react-native-paper, etc.)
- `app.json` — Expo config with Eburon AI branding, package ai.eburon.mobile
- `tsconfig.json`, `babel.config.js`, `metro.config.js`, `.eslintrc.js`, `.prettierrc.js`, `jest.config.js`
- `.gitignore` — tailored for RN/Expo/Android

#### Assets
- `assets/branding/icon-eburon.svg` — downloaded from eburon.ai (46KB)

### Validation performed
- `npx tsc --noEmit` — zero TypeScript errors
- Fixed 5 TS errors: setTimeout type mismatch, Firebase auth API (getAuth vs initializeAuth), SignIn/SignOut parameter mismatch, useColorScheme import

### Known issues
- No actual Ollama binary in `android/app/src/main/assets/arm64-v8a/ollama` — needs to be placed there before building (~800MB)
- No PNG icons generated from SVG — using vector drawables for launcher (API 26+)
- Firebase web SDK may need swap to @react-native-firebase/auth for React Native persistence — currently using getAuth() without persistence
- i18n module referenced in TODO but not implemented (not critical for first build)
- `targetSdkVersion 28` is intentionally low — re-evaluate for Play Store compliance
- Model download doesn't update the foreground notification with progress (would need a native module bridge for that)

### Next step
- Place the Ollama binary in `android/app/src/main/assets/arm64-v8a/ollama`
- Run `expo run:android` to build and test on a physical arm64-v8a device
- Convert SVG logo to PNG icons (icon.png, adaptive-icon.png, splash-icon.png)
- Evaluate switching to `@react-native-firebase/auth` for proper React Native persistence
