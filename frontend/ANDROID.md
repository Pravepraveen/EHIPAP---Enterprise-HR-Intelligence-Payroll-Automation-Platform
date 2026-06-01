# EHIPAP Android App (Capacitor)

## Quick build

From project root:

```powershell
.\scripts\build-android.ps1
```

Or from `frontend/`:

```powershell
npm run build:android
npx cap sync android
cd android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "C:\Android\Sdk"
.\gradlew.bat assembleDebug assembleRelease bundleRelease
```

## Output locations

| Artifact | Path |
|----------|------|
| Debug APK | `frontend/android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK (signed) | `frontend/android/app/build/outputs/apk/release/app-release.apk` |
| Release AAB (Play Store) | `frontend/android/app/build/outputs/bundle/release/app-release.aab` |

## Backend connection

1. Start backend: `.\scripts\start-all.ps1` from project root.
2. For a physical phone, verify the LAN URL first:

   ```powershell
   .\scripts\phone-health.ps1
   ```

3. Build the APK from the project root:

   ```powershell
   .\scripts\build-android.ps1
   ```

   The build script auto-detects your PC LAN IP, writes `frontend/.env.android`, verifies demo login through that IP, and copies the fresh install file to `phone-apk\EHIPAP.apk`.

4. **Android Emulator**: use `http://10.0.2.2:8880` if you manually edit `frontend/.env.android`.
5. **Physical device manual override**:

   ```
   VITE_API_BASE_URL=http://YOUR_PC_LAN_IP:8880
   ```

   Use the same Wi‑Fi network as your PC. Find IP: `ipconfig` → IPv4 Address.

## Install debug APK

```powershell
adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

Or install the copied phone APK:

```powershell
adb install -r phone-apk\EHIPAP.apk
```

## Demo logins

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | Admin@123 |
| HR Manager | hrmanager | HRManager@123 |
| Employee | john.doe | Employee@123 |

## Requirements

- Node.js 18+
- JDK 21 (Temurin) — `org.gradle.java.home` in `android/gradle.properties`
- Android SDK at `C:\Android\Sdk` with platform 36, build-tools 35/36

## Web app unchanged

Website dev flow is unchanged: `cd frontend && npm run dev` (port 5173, Vite proxy).
