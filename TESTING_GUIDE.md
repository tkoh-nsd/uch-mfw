# Booking/Locking Feature Testing Guide

## Overview
This guide will help you test the booking/locking feature and real-time database updates to ensure the app works correctly when deployed to the internet.

## Prerequisites
- The development server should be running (`npm run dev`)
- You should have at least one appointment in the database for today's date
- Open the app in **two different browser windows** (or use incognito mode for one)

## Test Scenarios

### Test 1: Basic Booking Flow
**Objective**: Verify that a user can book, edit, and save an appointment

1. **Open Browser Window 1**
   - Navigate to `http://localhost:5174/`
   - You should see a table with appointments
   - All rows should show a blue "Book" button

2. **Book an Appointment**
   - Click the "Book" button on any row
   - ✅ Expected: Button changes to "Save" (green) and "Cancel" (gray)
   - ✅ Expected: Input fields become editable (white background)
   - ✅ Expected: Toast notification shows "Appointment booked for editing"

3. **Edit the Appointment**
   - Type in any of the editable fields (Pt Name 1, ID 1, Phone 1, etc.)
   - ✅ Expected: Fields accept input normally

4. **Save the Appointment**
   - Click the "Save" button
   - ✅ Expected: Changes are saved
   - ✅ Expected: Buttons change back to "Book"
   - ✅ Expected: Input fields become disabled (gray background)
   - ✅ Expected: Toast notification shows "Appointment saved successfully"
   - ✅ Expected: "Last Edit" column updates with current timestamp

---

### Test 2: Concurrent User Locking
**Objective**: Verify that when one user books a row, other users cannot edit it

1. **Browser Window 1** (User 1)
   - Click "Book" on a specific appointment (e.g., the first row)
   - ✅ Expected: Row becomes editable for User 1

2. **Open Browser Window 2** (User 2) - **IMPORTANT: Use Incognito/Private Mode**
   - Navigate to `http://localhost:5174/`
   - Look at the same appointment that User 1 booked
   - ✅ Expected: Row shows a red lock icon with "Locked" text
   - ✅ Expected: Input fields are disabled (gray background)
   - ✅ Expected: No "Book" button is visible

3. **Browser Window 2** (User 2)
   - Try to click on the disabled input fields
   - ✅ Expected: Fields remain disabled, cannot type

4. **Browser Window 1** (User 1)
   - Make some edits to the appointment
   - Click "Save"
   - ✅ Expected: Changes saved successfully

5. **Browser Window 2** (User 2)
   - ✅ Expected: Lock icon disappears automatically
   - ✅ Expected: "Book" button appears
   - ✅ Expected: Changes made by User 1 are visible immediately

---

### Test 3: Cancel Booking
**Objective**: Verify that a user can cancel a booking without saving

1. **Browser Window 1**
   - Click "Book" on an appointment
   - Make some edits to the fields

2. **Click "Cancel" button**
   - ✅ Expected: Buttons change back to "Book"
   - ✅ Expected: Fields become disabled
   - ✅ Expected: Changes are discarded (original values restored)
   - ✅ Expected: Toast notification shows "Booking cancelled"

3. **Browser Window 2**
   - ✅ Expected: Lock icon disappears
   - ✅ Expected: "Book" button appears
   - ✅ Expected: No changes were saved

---

### Test 4: Real-Time Database Updates
**Objective**: Verify that changes made by one user are immediately visible to other users

1. **Browser Window 1** (User 1)
   - Book an appointment
   - Edit "Pt Name 1" to "Test Patient A"
   - Edit "Phone 1" to "12345678"
   - Click "Save"

2. **Browser Window 2** (User 2)
   - ✅ Expected: Within 1-2 seconds, the changes appear automatically
   - ✅ Expected: "Pt Name 1" shows "Test Patient A"
   - ✅ Expected: "Phone 1" shows "12345678"
   - ✅ Expected: "Last Edit" timestamp updates

3. **Browser Window 2** (User 2)
   - Book a different appointment
   - Make edits and save

4. **Browser Window 1** (User 1)
   - ✅ Expected: Changes from User 2 appear automatically

---

### Test 5: Multiple Users Trying to Book Same Row
**Objective**: Verify race condition handling

1. **Browser Window 1 & 2**
   - Both users try to click "Book" on the same row at nearly the same time

2. **Expected Behavior**
   - ✅ One user successfully books (sees Save/Cancel buttons)
   - ✅ Other user sees "Locked" indicator
   - ✅ Only one user can edit at a time

---

### Test 6: Session Persistence
**Objective**: Verify that user ID persists across page refreshes

1. **Browser Window 1**
   - Book an appointment
   - Note that you can edit it

2. **Refresh the page (F5 or Cmd+R)**
   - ✅ Expected: Same appointment still shows Save/Cancel buttons
   - ✅ Expected: You can still edit the appointment
   - ✅ Expected: Your booking is maintained

3. **Browser Window 2**
   - ✅ Expected: Still shows "Locked" indicator
   - ✅ Expected: Cannot edit the appointment

---

### Test 7: Date Navigation
**Objective**: Verify booking works across different dates

1. **Browser Window 1**
   - Book an appointment on today's date
   - Click "Next Day" button
   - ✅ Expected: Different appointments load
   - ✅ Expected: All show "Book" buttons (no locks from previous date)

2. **Click "Previous Day" to return to today**
   - ✅ Expected: Your booking is still active
   - ✅ Expected: Shows Save/Cancel buttons

---

## Automated Test Script

Run the automated test script to verify backend functionality:

```bash
npm run test-booking
```

This script will:
- Simulate two different users
- Test booking, editing, saving, and canceling
- Verify real-time database updates
- Verify locking mechanism
- Restore original data after testing

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All manual tests pass in local environment
- [ ] Automated test script passes
- [ ] Test with multiple browser windows/tabs
- [ ] Test with incognito/private mode
- [ ] Test on different devices (desktop, mobile)
- [ ] Verify Firebase security rules are properly configured
- [ ] Test with slow network connection (throttle in DevTools)
- [ ] Verify real-time updates work within 1-2 seconds
- [ ] Test booking timeout (if implemented)
- [ ] Verify user ID persistence across sessions

---

## Troubleshooting

### Issue: Changes don't appear in real-time
- Check browser console for errors
- Verify Firebase connection
- Check network tab for Firestore connections

### Issue: Both users can edit same row
- Clear browser cache and localStorage
- Use incognito mode for second user
- Check that user IDs are different (check localStorage)

### Issue: Booking doesn't work
- Check Firebase security rules
- Verify Firestore permissions
- Check browser console for errors

---

## Expected Performance

- **Booking action**: < 500ms
- **Save action**: < 1 second
- **Real-time update propagation**: 1-2 seconds
- **UI responsiveness**: Immediate feedback on all actions

---

## Success Criteria

✅ All 7 test scenarios pass  
✅ No console errors  
✅ Real-time updates work consistently  
✅ Locking prevents concurrent edits  
✅ User experience is smooth and responsive  
✅ Data integrity is maintained  

When all criteria are met, the app is ready for production deployment!

