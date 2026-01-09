# 📅 Calendar Disabled Dates Feature

## Overview

The calendar UI now automatically disables specific dates to prevent users from selecting non-working days:
- **Saturdays** (every week)
- **Sundays** (every week)
- **Public Holidays** (stored in Firestore)

---

## 🗄️ Database Structure

### Public Holidays Collection

**Collection:** `public_holidays` (root level)

**Document Structure:**
- **Document ID:** Date string in `YYYY-MM-DD` format (e.g., `2026-02-17`)
- **Fields:**
  - `date`: String - The date in `YYYY-MM-DD` format
  - `description`: String - Description of the holiday (e.g., "Public Holiday")
  - `createdAt`: String - ISO timestamp when the document was created

**Example:**
```
public_holidays/
├── 2026-02-17
│   ├── date: "2026-02-17"
│   ├── description: "Public Holiday"
│   └── createdAt: "2026-01-06T04:50:00.000Z"
├── 2026-02-18
│   ├── date: "2026-02-18"
│   ├── description: "Public Holiday"
│   └── createdAt: "2026-01-06T04:50:00.000Z"
└── ...
```

---

## 📋 Current Public Holidays

The following dates are currently configured as public holidays:

| Date       | Day of Week | Description     |
|------------|-------------|-----------------|
| 2026-02-17 | Tuesday     | Public Holiday  |
| 2026-02-18 | Wednesday   | Public Holiday  |
| 2026-02-19 | Thursday    | Public Holiday  |
| 2026-04-03 | Friday      | Public Holiday  |
| 2026-04-04 | Saturday    | Public Holiday  |
| 2026-04-06 | Monday      | Public Holiday  |
| 2026-04-07 | Tuesday     | Public Holiday  |
| 2026-05-01 | Friday      | Public Holiday  |
| 2026-05-25 | Monday      | Public Holiday  |

**Total:** 9 public holidays

---

## 🔧 Implementation Details

### 1. Firestore Rules

Updated `firestore.rules` to allow read/write access to `public_holidays`:

```javascript
// Public holidays collection (read-only for clients, write for admin)
match /public_holidays/{date} {
  allow read: if true;
  allow write: if true; // For development - restrict in production
}
```

### 2. Frontend Component

**File:** `src/components/AppointmentView.vue`

**Key Features:**
- Fetches public holidays from Firestore on component mount
- Generates disabled dates array including:
  - All Saturdays (day of week = 6)
  - All Sundays (day of week = 0)
  - All dates in the `public_holidays` collection
- Applies `disabledDates` prop to PrimeVue DatePicker component

**Code Snippet:**
```vue
<DatePicker
  v-model="calendarDate"
  @date-select="onDateSelect"
  :inline="true"
  dateFormat="yy-mm-dd"
  :disabledDates="disabledDates"
/>
```

### 3. Date Generation Logic

The component generates disabled dates for a 3-year range (1 year back, 2 years forward) to ensure the calendar always has the correct disabled dates visible.

---

## 📝 Adding New Public Holidays

### Method 1: Using the Script

1. Edit `scripts/addPublicHolidays.js`
2. Add new dates to the `publicHolidays` array:
   ```javascript
   const publicHolidays = [
     '2026-02-17',
     '2026-02-18',
     // Add new dates here
     '2026-12-25',
   ];
   ```
3. Run the script:
   ```bash
   node scripts/addPublicHolidays.js
   ```

### Method 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/tkoh-mfw/firestore)
2. Navigate to the `public_holidays` collection
3. Click "Add document"
4. Set **Document ID** to the date (e.g., `2026-12-25`)
5. Add fields:
   - `date`: `2026-12-25`
   - `description`: `Christmas Day`
   - `createdAt`: Current timestamp
6. Click "Save"

### Method 3: Programmatically

```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const addPublicHoliday = async (date, description = 'Public Holiday') => {
  await setDoc(doc(db, 'public_holidays', date), {
    date: date,
    description: description,
    createdAt: new Date().toISOString()
  });
};

// Usage
await addPublicHoliday('2026-12-25', 'Christmas Day');
```

---

## 🗑️ Removing Public Holidays

### Using Firebase Console

1. Go to Firebase Console → Firestore
2. Navigate to `public_holidays` collection
3. Find the document with the date you want to remove
4. Click the document and select "Delete"

### Using Script

Create a delete script or modify the existing one to delete specific dates.

---

## 🔄 How It Works

1. **On Page Load:**
   - Component fetches all documents from `public_holidays` collection
   - Generates disabled dates array (Saturdays, Sundays, public holidays)
   - Applies to DatePicker component

2. **User Interaction:**
   - User sees disabled dates grayed out in calendar
   - Cannot select disabled dates
   - Can only select weekdays that are not public holidays

3. **Real-time Updates:**
   - If you add/remove public holidays, users need to refresh the page to see changes
   - Consider adding a real-time listener if you need instant updates

---

## 🚀 Deployment Status

✅ **Deployed to Firebase Hosting:** https://tkoh-mfw.web.app  
✅ **Firestore Rules Updated:** Public holidays collection accessible  
✅ **Public Holidays Added:** 9 dates configured  
✅ **Calendar Component Updated:** Disabled dates feature active  

---

## 📌 Notes

- Disabled dates are calculated client-side for performance
- The date range covers 3 years (1 year back, 2 years forward)
- Weekends (Sat/Sun) are always disabled automatically
- Public holidays are fetched once on component mount
- Users cannot select disabled dates in the calendar UI

---

## 🔐 Security Considerations

**Current (Development):**
```javascript
match /public_holidays/{date} {
  allow read: if true;
  allow write: if true;
}
```

**Recommended for Production:**
```javascript
match /public_holidays/{date} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

This ensures only authenticated admin users can modify public holidays.

