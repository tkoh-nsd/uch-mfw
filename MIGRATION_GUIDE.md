# Database Structure Migration Guide

## Overview

This guide explains the database structure migration from a flat structure to a nested structure.

## Database Structure Changes

### Old Structure (Flat)
```
(root)
├── 2026-01-06 (collection)
│   ├── doc1 (appointment)
│   ├── doc2 (appointment)
├── 2026-01-07 (collection)
│   ├── doc1 (appointment)
```

**Problems:**
- ❌ Root level cluttered with many date collections
- ❌ Hard to manage and query
- ❌ No logical grouping

### New Structure (Nested)
```
(root)
└── bookings (collection)
    ├── 2026-01-06 (document)
    │   └── appointments (subcollection)
    │       ├── doc1 (appointment)
    │       ├── doc2 (appointment)
    ├── 2026-01-07 (document)
        └── appointments (subcollection)
            ├── doc1 (appointment)
```

**Benefits:**
- ✅ Clean root level with single "bookings" collection
- ✅ Better organization and scalability
- ✅ Easier to manage and query
- ✅ Can add metadata to date documents if needed

## Migration Steps

### Step 1: Update Code (Already Done ✅)

The following files have been updated:
- ✅ `src/stores/appointmentStore.js` - Updated all Firestore queries
- ✅ `src/utils/excelImport.js` - Updated import logic
- ✅ `firestore.rules` - Updated security rules and deployed

### Step 2: Run Migration Script

Migrate existing data from old structure to new structure:

```bash
node scripts/migrateToNewStructure.js
```

This script will:
1. Read data from old structure: `{date}/{appointmentId}`
2. Write to new structure: `bookings/{date}/appointments/{appointmentId}`
3. Use batch writes for efficiency (500 docs per batch)
4. Keep old data intact (safe migration)

### Step 3: Verify Migration

1. Check the Firebase Console to verify data exists in new structure
2. Test the application to ensure everything works
3. Check that all features work:
   - ✅ View appointments
   - ✅ Book appointments
   - ✅ Edit appointments
   - ✅ Save appointments
   - ✅ Import Excel data

### Step 4: Delete Old Structure (Optional)

After verifying the migration is successful:

```bash
node scripts/deleteOldStructure.js
```

**⚠️ WARNING:** This will permanently delete the old data!

## Code Changes Summary

### appointmentStore.js
```javascript
// OLD
const appointmentsRef = collection(db, dateStr);
const appointmentRef = doc(db, dateStr, appointmentId);

// NEW
const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
const appointmentRef = doc(db, 'bookings', dateStr, 'appointments', appointmentId);
```

### excelImport.js
```javascript
// OLD
const collectionRef = collection(db, date);

// NEW
const appointmentsRef = collection(db, 'bookings', date, 'appointments');
```

### firestore.rules
```javascript
// OLD
match /{date}/{appointment} {
  allow read, write: if true;
}

// NEW
match /bookings/{date}/appointments/{appointment} {
  allow read, write: if true;
}
```

## Rollback Plan

If you need to rollback:

1. The old data is still intact (migration doesn't delete it)
2. Revert the code changes in git:
   ```bash
   git checkout HEAD~1 src/stores/appointmentStore.js
   git checkout HEAD~1 src/utils/excelImport.js
   git checkout HEAD~1 firestore.rules
   ```
3. Redeploy the old Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] Data visible in Firebase Console under `bookings/{date}/appointments`
- [ ] Application loads appointments correctly
- [ ] Can book an appointment
- [ ] Can edit and save an appointment
- [ ] Can cancel a booking
- [ ] Excel import works correctly
- [ ] Real-time updates work
- [ ] All dates show correct data

## Support

If you encounter any issues during migration, check:
1. Firebase Console for error messages
2. Browser console for JavaScript errors
3. Network tab for failed Firestore requests

