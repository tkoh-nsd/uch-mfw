# Quick Test Checklist for Booking Feature

## Setup
1. ✅ Dev server is running at http://localhost:5174/
2. Open the app in your browser
3. Open a second browser window in **Incognito/Private mode** (this simulates a second user)

---

## 🧪 Quick 5-Minute Test

### Window 1 (Normal Browser)

**Step 1: Initial State**
- [ ] You see a table with appointments
- [ ] All rows show a blue "Book" button
- [ ] All input fields are disabled (gray background)

**Step 2: Book an Appointment**
- [ ] Click "Book" on any row
- [ ] Button changes to green "Save" and gray "Cancel"
- [ ] Input fields become enabled (white background)
- [ ] You see a success toast notification

**Step 3: Edit the Appointment**
- [ ] Type "Test Patient" in "Pt Name 1" field
- [ ] Type "12345678" in "Phone 1" field
- [ ] Type "Testing" in "Remarks" field
- [ ] Fields accept your input

---

### Window 2 (Incognito/Private Browser)

**Step 4: Check Locking**
- [ ] Open http://localhost:5174/ in incognito mode
- [ ] Find the same row you booked in Window 1
- [ ] You see a red lock icon with "Locked" text
- [ ] Input fields are disabled (gray background)
- [ ] You CANNOT type in the fields

---

### Window 1 (Normal Browser)

**Step 5: Save Changes**
- [ ] Click the green "Save" button
- [ ] You see "Appointment saved successfully" toast
- [ ] Buttons change back to "Book"
- [ ] "Last Edit" column shows current timestamp
- [ ] Fields become disabled again

---

### Window 2 (Incognito/Private Browser)

**Step 6: Verify Real-Time Update**
- [ ] Within 1-2 seconds, the lock icon disappears
- [ ] "Book" button appears
- [ ] You see "Test Patient" in "Pt Name 1"
- [ ] You see "12345678" in "Phone 1"
- [ ] You see "Testing" in "Remarks"
- [ ] "Last Edit" timestamp is updated

**Step 7: Book from Second User**
- [ ] Click "Book" on a different row
- [ ] Button changes to "Save" and "Cancel"
- [ ] Fields become editable

---

### Window 1 (Normal Browser)

**Step 8: Verify Second User's Lock**
- [ ] Look at the row that Window 2 just booked
- [ ] You see a red lock icon with "Locked"
- [ ] You CANNOT edit that row

---

### Window 2 (Incognito/Private Browser)

**Step 9: Test Cancel**
- [ ] Click the gray "Cancel" button
- [ ] You see "Booking cancelled" toast
- [ ] Buttons change back to "Book"
- [ ] Fields become disabled
- [ ] Your edits are discarded

---

### Window 1 (Normal Browser)

**Step 10: Verify Cancel Worked**
- [ ] The lock icon on that row disappears
- [ ] "Book" button appears
- [ ] No changes were saved

---

## ✅ Success Criteria

If ALL checkboxes above are checked, then:

✅ **Booking/Locking feature works correctly**  
✅ **Real-time database updates work**  
✅ **Multi-user concurrent editing is prevented**  
✅ **The app is ready for production deployment**

---

## 🚀 Next Steps

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

3. **Test on production URL** with the same checklist above

---

## 📊 Expected Behavior Summary

| Action | Window 1 | Window 2 | Database |
|--------|----------|----------|----------|
| W1 clicks "Book" | Shows Save/Cancel | Shows "Locked" | Sets booked_by |
| W1 edits fields | Can type | Cannot type | No change yet |
| W1 clicks "Save" | Shows "Book" | Shows "Book" + changes | Saves data, clears booked_by |
| W2 clicks "Book" | Shows "Locked" | Shows Save/Cancel | Sets booked_by |
| W2 clicks "Cancel" | Shows "Book" | Shows "Book" | Clears booked_by |

---

## 🐛 Troubleshooting

**Problem: Both windows can edit the same row**
- Solution: Make sure Window 2 is in Incognito/Private mode
- Check: Open DevTools → Application → Local Storage → verify different userId

**Problem: Changes don't appear in real-time**
- Solution: Wait 2-3 seconds for Firestore sync
- Check: Browser console for errors
- Check: Network tab for Firestore connections

**Problem: "Book" button doesn't work**
- Solution: Check browser console for errors
- Check: Firebase configuration is correct
- Check: Firestore security rules allow writes

---

## 📝 Notes

- Each browser window/tab gets a unique user ID stored in localStorage
- Incognito mode ensures a different user ID
- Real-time updates typically take 1-2 seconds
- The booking system prevents race conditions
- User ID persists across page refreshes (same browser)

---

**Test Date:** _________________  
**Tested By:** _________________  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _________________________________________________

