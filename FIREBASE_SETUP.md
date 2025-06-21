# Firebase Setup Guide for SmartVoyage

## 🔥 Firebase Configuration

To enable authentication and trip saving features, you need to set up Firebase:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "smartvoyage-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider
5. Add your authorized domain (localhost for development)
6. Save the changes

### 3. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location for your database
5. Click "Done"

### 4. Get Your Firebase Config

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "smartvoyage-web")
6. Copy the config object

### 5. Set Environment Variables

Create a `.env` file in the `frontend` directory with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 6. Deploy Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init firestore`
4. Deploy the security rules: `firebase deploy --only firestore:rules`

The security rules are already configured in `firestore.rules` to ensure users can only access their own trips.

## 🚀 Features Enabled

Once configured, you'll have:

- ✅ Google Sign-in authentication
- ✅ Save trips to Firestore database
- ✅ My Trips page to view saved itineraries
- ✅ Secure access (users can only see their own trips)
- ✅ Delete trips functionality
- ✅ User profile display in navigation

## 📱 Usage

1. **Sign In**: Click "Sign In" in the navigation to authenticate with Google
2. **Generate Trip**: Use the itinerary generator as usual
3. **Save Trip**: Click "Save Trip" button to store in your account
4. **View Trips**: Go to "My Trips" to see all your saved itineraries
5. **Share**: Trips can still be shared via URL (stored in localStorage)

## 🔒 Security

- All Firestore operations require authentication
- Users can only access their own trips
- Security rules prevent unauthorized access
- No sensitive data is stored in localStorage

## 💰 Free Tier Limits

Firebase Spark (free) plan includes:
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1GB stored data
- 10GB/month transferred

This is more than sufficient for a prototype or small application. 