# Medical Appointment Management System

A real-time medical appointment management web application built with Vue.js, PrimeVue, Pinia, and Firebase.

## Features

- 📅 Interactive calendar for date selection
- ⏮️ Previous Day / Next Day / Today navigation buttons
- 📊 Real-time data synchronization across multiple users
- ✏️ Editable patient information fields
- 💾 Individual row save functionality
- 🕐 Last edit timestamp tracking (Hong Kong timezone)
- 🔄 Automatic updates when database changes

## Tech Stack

- **Frontend**: Vue.js 3 with Vite
- **UI Framework**: PrimeVue 4
- **State Management**: Pinia
- **Backend & Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Date Handling**: Day.js with timezone support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account and project

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select your existing project
3. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Choose production mode or test mode
   - Select a location

4. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click on the web app icon or "Add app" if you haven't created one
   - Copy the Firebase configuration object

5. Update Firebase configuration in the following files:
   - `src/firebase.js` - Replace the firebaseConfig object
   - `scripts/importData.js` - Replace the firebaseConfig object
   - `.firebaserc` - Replace "YOUR_PROJECT_ID" with your actual project ID

### 2. Install Dependencies

```bash
npm install
```

Note: If you encounter an error about `@primevue/themes/aura` not being resolved, run:
```bash
npm install @primevue/themes
```

### 3. Import Excel Data to Firestore

Make sure your `MFW.xlsx` file is in the root directory, then run:

```bash
npm run import-data
```

This will parse the Excel file and import all appointments into Firestore, organized by date.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to Firebase Hosting

First, install Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

Deploy:

```bash
firebase deploy
```

## Data Structure

### Firestore Collections

The data is organized in Firestore as follows:

```
Collection: {date} (e.g., "2024-01-15")
  └── Document: {auto-generated-id}
      ├── date: "2024-01-15"
      ├── weekday: "Monday"
      ├── time: "09:00"
      ├── service: "Room A"
      ├── pt_name_1: "Patient Name"
      ├── id_1: "ID123"
      ├── phone_1: "12345678"
      ├── pt_name_2: "Patient Name 2"
      ├── id_2: "ID456"
      ├── phone_2: "87654321"
      ├── remarks: "Some remarks"
      └── last_edit: "2024-01-15 14:30" (added when saved)
```

### Editable Fields

The following fields are editable in the web interface:
- Pt Name 1
- ID 1
- Phone 1
- Pt Name 2
- ID 2
- Phone 2
- Remarks

All other fields (Date, Weekday, Time, Service) are read-only.

## Real-time Synchronization

The application uses Firestore's real-time listeners to automatically sync data across all connected clients. When any user saves changes:

1. The data is immediately updated in Firestore
2. All other users viewing the same date will see the changes instantly
3. The "Last Edit" timestamp is updated with Hong Kong timezone

## Usage

1. **Select a Date**: Click on the calendar to select a date, or use the navigation buttons
2. **View Appointments**: All appointments for the selected date will be displayed in the table
3. **Edit Information**: Click on any editable field to modify the data
4. **Save Changes**: Click the "Save" button for the specific row to save changes
5. **View Last Edit**: The "Last Edit" column shows when the appointment was last modified

## Security Notes

⚠️ **Important**: Before deploying to production:

1. Set up proper Firestore Security Rules
2. Enable authentication if needed
3. Restrict access to authorized users only

Example Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all authenticated users
    match /{date}/{appointment} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Data not loading
- Check Firebase configuration in `src/firebase.js`
- Verify Firestore security rules allow read access
- Check browser console for errors

### Import script fails
- Ensure `MFW.xlsx` is in the root directory
- Verify Firebase configuration in `scripts/importData.js`
- Check that Firestore is enabled in your Firebase project

### Real-time updates not working
- Verify you're using the same date across different browser windows
- Check network connectivity
- Ensure Firestore security rules allow read access

## License

MIT
