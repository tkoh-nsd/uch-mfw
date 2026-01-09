# Quick Setup Guide

Follow these steps to get your Medical Appointment Management System up and running.

## Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Enter project name (e.g., "medical-appointments")
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In Firebase Console, click "Firestore Database" in the left menu
   - Click "Create database"
   - Select "Start in test mode" (for development)
   - Choose a location close to your users
   - Click "Enable"

3. **Register Web App**
   - In Firebase Console, click the gear icon → "Project settings"
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Register app with a nickname (e.g., "Medical Appointments Web")
   - Copy the Firebase configuration object

## Step 2: Configure Your Application

1. **Update `src/firebase.js`**
   
   Replace the firebaseConfig object with your actual configuration:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

2. **Update `scripts/importData.js`**
   
   Replace the firebaseConfig object with the same configuration

3. **Update `.firebaserc`**
   
   Replace "YOUR_PROJECT_ID" with your actual Firebase project ID:
   
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

## Step 3: Import Your Data

1. **Prepare Excel File**
   - Ensure `MFW.xlsx` is in the root directory
   - Verify the Excel file has the correct format:
     - Column A: Date
     - Column B: Weekday
     - Column C: Time
     - Column D: Venue
     - Column E: Pt_name_1
     - Column F: ID_1
     - Column G: Phone_1
     - Column H: Pt_name_2
     - Column I: ID_2
     - Column J: Phone_2
     - Column K: Remarks

2. **Run Import Script**
   ```bash
   npm run import-data
   ```
   
   This will:
   - Read the Excel file
   - Parse all appointments
   - Upload them to Firestore organized by date
   - Show progress in the console

## Step 4: Run the Application

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open in Browser**
   - Navigate to http://localhost:5173/
   - You should see the appointment management interface

3. **Test the Application**
   - Select a date from the calendar
   - Verify appointments are displayed
   - Try editing a field and clicking Save
   - Open the same date in another browser window to test real-time sync

## Step 5: Deploy to Firebase Hosting (Optional)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Build the Application**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   firebase deploy
   ```

5. **Access Your App**
   - Your app will be available at: `https://your-project-id.web.app`

## Firestore Security Rules

⚠️ **Important**: The default rules allow public access for development.

For production, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{date}/{appointment} {
      // Only allow authenticated users
      allow read, write: if request.auth != null;
      
      // Or restrict to specific users
      // allow read, write: if request.auth.token.email in [
      //   'user1@example.com',
      //   'user2@example.com'
      // ];
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Verify Firebase configuration is correct
- Ensure Firestore is enabled in Firebase Console

### Data not importing
- Verify Excel file path is correct
- Check Firebase configuration in `scripts/importData.js`
- Look for error messages in console

### Real-time updates not working
- Ensure multiple windows are viewing the same date
- Check browser console for errors
- Verify internet connection

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for any TypeScript or linting errors

## Next Steps

1. **Add Authentication** (recommended for production)
   - Enable Firebase Authentication
   - Add login/logout functionality
   - Update security rules to require authentication

2. **Customize Styling**
   - Modify PrimeVue theme in `src/main.js`
   - Update component styles in `src/components/AppointmentView.vue`

3. **Add Features**
   - Export appointments to Excel
   - Search and filter functionality
   - Appointment statistics and reports
   - Email notifications

## Support

For issues or questions:
1. Check the main README.md
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check PrimeVue documentation: https://primevue.org/

