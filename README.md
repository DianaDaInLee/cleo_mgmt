# Cleo Mgmt — Local Election Data Project

A password-protected project management website for tracking local election and demographic data collection across countries.

## Features

- **Password protection** — gate the entire site behind a shared password
- **Dashboard** — weekly timeline with add/remove events, and quick links to key documents
- **Tracker** — country × progress matrix with checkboxes and "Led By" field
- **Progress** — overall completion stats and per-country pie charts

All data (timeline events, tracker rows) is stored in Firebase Firestore.

---

## Setup

### 1. Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Add a **Web app** to the project
3. Enable **Firestore Database** (start in production mode)
4. Add the following Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

### 3. GitHub Pages

1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**

### 4. Deploy

Push to `main` — the GitHub Actions workflow will build and deploy to GitHub Pages automatically.

The site will be available at: `https://<your-username>.github.io/cleo_mgmt/`

---

## Local development

```bash
cp .env.example .env
# Fill in your Firebase values in .env

npm install
npm run dev
```

---

## Password

The site password is set in `src/components/Login.jsx` (`CORRECT_PASSWORD`).
