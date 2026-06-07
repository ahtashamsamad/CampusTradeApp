# Google Sign-In Setup Guide

## Overview
The login screen now has a "Continue with Google" button connected to Firebase Authentication. Follow these steps to fully enable Google Sign-In.

## Prerequisites
- Firebase Project created
- Firebase Console access
- Android/iOS development environment (if testing on native)

## Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **OAuth Consent Screen**
4. Choose **External** as the user type
5. Fill in the required information:
   - **App name**: Campus Trade
   - **User support email**: Your email
   - **Developer contact**: Your email
6. Click **Save and Continue**
7. Add scopes:
   - `email`
   - `profile`
8. Click **Save and Continue** through all screens

## Step 2: Create OAuth 2.0 Credentials

### For Web Application:
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Name it "Campus Trade Web"
5. Add Authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:5000`
   - Your Firebase project URL: `https://[PROJECT_ID].firebaseapp.com/__/auth/handler`
6. Copy the **Client ID** and **Client Secret**

### For Android:
1. In Credentials, click **Create Credentials** > **OAuth client ID**
2. Choose **Android**
3. Get your app's SHA-1 fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```
4. Add the SHA-1 to Android credentials
5. Add package name: `com.campustrade` (from your app.json)

### For iOS:
1. In Credentials, click **Create Credentials** > **OAuth client ID**
2. Choose **iOS**
3. Add Bundle ID: `com.campustrade` (from your app.json)
4. Add URL schemes if needed

## Step 3: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Build** > **Authentication**
4. Click on the **Sign-in method** tab
5. Click **Google**
6. Toggle **Enable**
7. Select the project from the dropdown (should auto-populate)
8. Click **Save**

## Step 4: Install Google Sign-In Package (Optional)

For native Android/iOS support, install:

```bash
cd frontend
npm install @react-native-google-signin/google-signin
```

Or with yarn:
```bash
yarn add @react-native-google-signin/google-signin
```

Then rebuild:
```bash
expo prebuild --clean
```

## Step 5: Update Firebase Config (If Using Native Package)

Create `frontend/google-services.json` from Firebase Console:
- Go to **Project Settings** > **General**
- Download `google-services.json`
- Place in `android/app/`

## Current Implementation Status

✅ **Login Screen**: "Continue with Google" button is functional  
✅ **Firebase Connection**: Google provider configured  
⚠️ **Native Support**: Requires package installation and Firebase Console setup

## Testing Google Sign-In

1. Start your development server:
   ```bash
   cd frontend
   npx expo start
   ```

2. Run on Android/iOS or web
3. Tap "Continue with Google" on the login screen
4. Follow the OAuth consent flow
5. User will be automatically logged in and redirected to home

## Troubleshooting

### "Google Sign-In requires additional Firebase Console setup"
- Make sure you completed Steps 1-3 above
- Verify OAuth credentials are created
- Check Firebase Console - Google provider is enabled

### Redirect URI Mismatch
- Ensure redirect URIs match exactly in Google Cloud Console
- For web: typically `http://localhost:5000/__/auth/handler` or your deployment URL

### SHA-1 Fingerprint Issues (Android)
- Get debug keystore SHA-1:
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- Add it to Android OAuth credentials

### iOS Bundle ID Issues
- Make sure Bundle ID matches in Xcode and Google Cloud Console
- Format: `com.companyname.appname`

## Code Integration Reference

**Login Screen**: `frontend/app/(auth)/login.tsx`
```tsx
const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    
    if (result.success) {
        router.replace('/(tabs)' as any);
    } else {
        Alert.alert('Google Sign-In', result.error);
    }
};
```

**Auth Context**: `frontend/context/AuthContext.tsx`
- `signInWithGoogle()` method handles the OAuth flow
- Creates/updates user in Firestore on successful sign-in
- Returns success/error status

## Next Steps

1. Complete OAuth setup in Google Cloud Console
2. Test on web first (easiest to debug)
3. Test on Android/iOS with Firebase credentials
4. Deploy your app with verified redirect URIs

---

For more details, see:
- [Firebase Google Auth Docs](https://firebase.google.com/docs/auth/web/google-signin)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/authentication/)
