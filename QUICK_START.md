# Quick Start Checklist

Follow this checklist to get your app running in 10 minutes!

## ☑️ Prerequisites
- [ ] Node.js installed (v16+)
- [ ] Firebase account created
- [ ] MFW.xlsx file in project root

## ☑️ Step 1: Firebase Setup (3 minutes)

1. [ ] Go to https://console.firebase.google.com/
2. [ ] Create new project or select existing
3. [ ] Enable Firestore Database (test mode)
4. [ ] Register web app and copy config

## ☑️ Step 2: Configure App (2 minutes)

1. [ ] Open `src/firebase.js`
2. [ ] Replace firebaseConfig with your config
3. [ ] Open `scripts/importData.js`
4. [ ] Replace firebaseConfig with your config
5. [ ] Open `.firebaserc`
6. [ ] Replace "YOUR_PROJECT_ID" with your project ID

## ☑️ Step 3: Import Data (2 minutes)

```bash
npm run import-data
```

- [ ] Wait for "Import completed!" message
- [ ] Check Firebase Console to verify data

## ☑️ Step 4: Run App (1 minute)

```bash
npm run dev
```

- [ ] Open http://localhost:5173/
- [ ] Select a date from calendar
- [ ] Verify appointments appear

## ☑️ Step 5: Test Features (2 minutes)

- [ ] Click "Previous Day" / "Next Day" buttons
- [ ] Click "Today" button
- [ ] Edit a patient name
- [ ] Click "Save" button
- [ ] Verify "Last Edit" timestamp appears
- [ ] Open same date in another browser tab
- [ ] Edit in one tab, verify it updates in other tab

## 🎉 Success!

Your Medical Appointment Management System is now running!

## 🚀 Optional: Deploy to Firebase

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

## 📖 Need Help?

- Detailed setup: See `SETUP_GUIDE.md`
- Excel format: See `EXCEL_FORMAT.md`
- Full docs: See `README.md`
- Project overview: See `PROJECT_SUMMARY.md`

## 🐛 Troubleshooting

**Data not showing?**
- Check Firebase config is correct
- Verify Firestore rules allow read access
- Check browser console for errors

**Import failed?**
- Ensure MFW.xlsx is in root directory
- Check Excel file format (see EXCEL_FORMAT.md)
- Verify Firebase config in importData.js

**Real-time not working?**
- Open same date in both windows
- Check internet connection
- Verify Firestore rules allow read access

## 📝 Your Firebase Config

Keep this handy for reference:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace in:
- ✅ src/firebase.js
- ✅ scripts/importData.js
- ✅ .firebaserc (project ID only)

