# Global Search Feature - Implementation Guide

## Overview
A comprehensive global search feature has been implemented that allows users to search across all appointments (all dates) and navigate to specific appointments with automatic filtering.

## What Was Implemented

### 1. Backend - Search Function
**File**: `src/stores/appointmentStore.js`
- Added `searchAppointments(searchTerm)` function
- Uses Firestore's `collectionGroup` query for cross-date searching
- Searches case-insensitively on: `pt_name` field only
- Returns results sorted by date (ascending) then time
- Includes error handling

### 2. Firestore Rules
**File**: `firestore.rules`
- Added collectionGroup rule: `match /{path=**}/appointments/{appointment}`
- **IMPORTANT**: Rule must come BEFORE specific path rules
- Deployed to Firebase: `firebase deploy --only firestore:rules`

### 3. UI Components
**File**: `src/components/AppointmentView.vue`

#### Search Button
- Location: Date navigation area (bottom-right)
- Icon: `pi pi-search`
- Style: Circular, outlined
- Tooltip: "Search appointments"

#### Search Modal
- Header: "Search Appointments" with gradient background
- Search input with autofocus and real-time search (300ms debounce)
  - Placeholder: "Search by patient name..."
- Loading spinner while searching
- Results display with date, time, service badge, and patient name
- Empty states:
  - No query: "Enter a patient name to search"
  - No results: "No appointments found"
- Scrollable results (max height 400px)

#### Reset Filters Button
- Location: Above DataTable, right-aligned
- Icon: `pi pi-filter-slash`
- Shows only when filters are active
- Clears all filters and shows toast notification

### 4. Search Functionality
When user clicks a search result:
1. Modal closes
2. Navigates to appointment's date
3. Applies filters to show ONLY that appointment
4. Shows success toast with date
5. Time and patient name filters are applied

### 5. Reset Filters
- Clears all filter values
- Clears filter snapshot
- Shows confirmation toast

## Testing the Feature

### Test 1: Basic Search
1. Click the search button (magnifying glass icon)
2. Type a patient name (e.g., "John")
3. Verify results appear with date, time, service badge, and patient name
4. Verify results are sorted by date then time
5. Verify placeholder says "Search by patient name..."

### Test 2: Search Navigation
1. Search for a patient name
2. Click on a result
3. Verify modal closes
4. Verify page navigates to that appointment's date
5. Verify table shows ONLY that appointment (filtered)
6. Verify success toast appears

### Test 3: Reset Filters
1. After navigating from search, click "Reset Filters" button
2. Verify all appointments for that date are shown
3. Verify toast confirms filters were reset

### Test 4: Multiple Dates
1. Search for a common name that appears on multiple dates
2. Verify results show appointments from different dates
3. Click on different results and verify navigation works

### Test 5: Empty States
1. Open search modal without typing - verify hint: "Enter a patient name to search"
2. Type a name that doesn't exist - verify "No appointments found"
3. Clear search - verify hint message reappears

## Important Notes

### Firestore Rules Order
The collectionGroup rule MUST come before specific path rules:
```firestore
// CORRECT - collectionGroup first
match /{path=**}/appointments/{appointment} {
  allow read, write: if true;
}
match /bookings/{date}/appointments/{appointment} {
  allow read, write: if true;
}

// WRONG - specific path first
match /bookings/{date}/appointments/{appointment} {
  allow read, write: if true;
}
match /{path=**}/appointments/{appointment} {
  allow read, write: if true;
}
```

### Deployment
After any changes to firestore.rules, deploy with:
```bash
firebase deploy --only firestore:rules
```

### Search Performance
- Search is debounced at 300ms to reduce Firestore queries
- Results are limited by what's in the database
- For large datasets, consider adding pagination

## Files Modified
1. `src/stores/appointmentStore.js` - Added searchAppointments function
2. `src/components/AppointmentView.vue` - Added UI and logic
3. `firestore.rules` - Added collectionGroup rule

## Build Status
✅ Build successful with no errors
✅ Firestore rules deployed successfully
✅ All features tested and working

