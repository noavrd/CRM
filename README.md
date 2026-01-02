# CRM for Appraisers 🏠⭐️ (Client + Server) — Setup & Run Guide

This repository contains:
- **Client** (React / MUI / Vite)
- **Server** (Node.js / Express)
- **Firebase / Firestore** backend
- **Google Calendar integration** (OAuth2 + Calendar API)

---

## 1) Prerequisites

Install these:
- **Node.js** (recommended: 18+ or 20+)
- **npm** 
- **Firebase project** with **Firestore enabled**
- **Google Cloud / OAuth** credentials for Calendar integration

---

# 2A) Server `.env`

Create:
/server/.env


```env
  # Firebase
  FIREBASE_PROJECT_ID=your-firebase-project-id
  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
  
  # Client URL (CORS / OAuth redirects)
  APP_BASE_URL=http://localhost:3000
  
  # Google OAuth (Calendar)
  GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
  GOOGLE_OAUTH_CLIENT_SECRET=xxxxx
  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/google/calendar/callback

  # Google Maps
  GOOGLE_MAPS_API_KEY=xxxxx
```

* GOOGLE_OAUTH_REDIRECT_URI must match exactly what you configure in Google Cloud Console. 
* Ensure Maps JavaScript API is enabled in Google Cloud.

Create:
/server/serviceAccountKey.json
- Copy credentials from firebase projects, it should look like this:

```serviceAccountKey.json
  {
    "type": "service_account",
    "project_id": xxxx,
    "private_key_id": xxxx,
    "private_key": "-----BEGIN PRIVATE KEY-----\xxxxx"
    "client_id": xxx,
    "auth_uri": xxxx,
    "token_uri": xxxx,
    "auth_provider_x509_cert_url":xxxx,
    "client_x509_cert_url": xxxx,
    "universe_domain": xxxx
  }
```

If you run server on a different port or behind a proxy, update redirect accordingly.

# 2B) Client .env
Create:
/client/.env.local

```.env.local
  
  # Google Maps
  VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
  
  # Use Firebase Web SDK (Auth, etc.)
  VITE_FIREBASE_API_KEY=xxxxxxxx
  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
  VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
```
Where to find Firebase Web config?
Firebase Console → Project settings → General → "Your apps" → Web app config.

# 2C) .gitignore

Create .gitinore file in the root folder
./gitignore

```.gitignore
  /client/node_modules
  /client/.env.local
  /server/node_modules
  /server/.env
  /server/serviceAccountKey.json
```


# 3) Google Calendar integration
If you want Calendar syncing:

3.1 Enable Google Calendar API
Google Cloud Console → APIs & Services → Library → Enable:

Google Calendar API

3.2 Create OAuth client
APIs & Services → Credentials → Create Credentials → OAuth Client ID

Application type: Web application

Authorized redirect URI:

http://localhost:3001/api/google/calendar/callback (local dev)

Add your production callback too (if you deploy)

3.3 Scopes
Your server generates auth URL with:

https://www.googleapis.com/auth/calendar.events

3.4 Important behavior
Refresh tokens are stored in Firestore under something like:
users/{userId}/integrations/googleCalendar

If the refresh token is missing/expired (invalid_grant), reconnect is required.

# 4) Install dependencies
From repo root, open 2 terminals:

1: 

```
  cd server
  npm install # Install dependencies
  npm run dev # Run BE
```
Server should run on:

`http://localhost:3001`

2: 

```
  cd client
  npm install # Install dependencies
  npm run dev # Run FE
```

Client runs on:

`http://localhost:3000`


