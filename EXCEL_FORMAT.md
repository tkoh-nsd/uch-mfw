# Excel File Format Reference

This document describes the expected format for the `MFW.xlsx` file.

## Column Structure

The Excel file should have the following columns (in order):

| Column | Field Name | Description | Example |
|--------|-----------|-------------|---------|
| A | Date | Appointment date (YYYY-MM-DD or Excel date) | 2024-01-15 |
| B | Weekday | Day of the week | Monday |
| C | Time | Appointment time (HH:mm format) | 09:00 |
| D | Service | Service type/Location | Room A |
| E | Pt_name_1 | Patient 1 name | John Doe |
| F | ID_1 | Patient 1 ID | A123456 |
| G | Phone_1 | Patient 1 phone | 12345678 |
| H | Pt_name_2 | Patient 2 name | Jane Smith |
| I | ID_2 | Patient 2 ID | B789012 |
| J | Phone_2 | Patient 2 phone | 87654321 |
| K | Remarks | Additional notes | Follow-up required |

## Important Notes

### Date and Weekday Handling

The import script handles empty date and weekday cells intelligently:

- **Empty Date Cell**: Uses the most recent non-empty date value above it
- **Empty Weekday Cell**: Uses the most recent non-empty weekday value above it

**Example:**

```
| Date       | Weekday  | Time  | Service | ... |
|------------|----------|-------|---------|-----|
| 2024-01-15 | Monday   | 09:00 | Room A  | ... |
|            |          | 10:00 | Room B  | ... |  ← Uses 2024-01-15, Monday
|            |          | 11:00 | Room A  | ... |  ← Uses 2024-01-15, Monday
| 2024-01-16 | Tuesday  | 09:00 | Room C  | ... |
|            |          | 10:30 | Room A  | ... |  ← Uses 2024-01-16, Tuesday
```

### Header Row

- The first row should contain column headers
- The import script automatically skips the first row

### Empty Rows

- Empty rows are automatically skipped during import
- No need to remove blank rows between data

### Data Types

- **Date**: Can be Excel date serial number or text in YYYY-MM-DD format
- **Time**: Text format (e.g., "09:00", "14:30")
- **All other fields**: Text strings
- Empty cells are stored as empty strings in Firestore

## Sample Data

Here's an example of how your Excel file should look:

```
| Date       | Weekday  | Time  | Service | Pt_name_1 | ID_1    | Phone_1  | Pt_name_2 | ID_2    | Phone_2  | Remarks        |
|------------|----------|-------|---------|-----------|---------|----------|-----------|---------|----------|----------------|
| 2024-01-15 | Monday   | 09:00 | Room A  | John Doe  | A123456 | 12345678 | Jane Doe  | B123456 | 23456789 | First visit    |
|            |          | 10:00 | Room B  | Bob Smith | C789012 | 34567890 |           |         |          | Follow-up      |
|            |          | 11:00 | Room A  | Alice Lee | D345678 | 45678901 | Tom Lee   | E345678 | 56789012 |                |
| 2024-01-16 | Tuesday  | 09:00 | Room C  | Mary Wong | F901234 | 67890123 |           |         |          | New patient    |
|            |          | 14:00 | Room A  | Peter Tan | G567890 | 78901234 | Lisa Tan  | H567890 | 89012345 | Couple therapy |
```

## Firestore Structure After Import

After importing, the data will be organized in Firestore as:

```
Collection: "2024-01-15"
  ├── Document: auto-generated-id-1
  │   ├── date: "2024-01-15"
  │   ├── weekday: "Monday"
  │   ├── time: "09:00"
  │   ├── service: "Room A"
  │   ├── pt_name_1: "John Doe"
  │   ├── id_1: "A123456"
  │   ├── phone_1: "12345678"
  │   ├── pt_name_2: "Jane Doe"
  │   ├── id_2: "B123456"
  │   ├── phone_2: "23456789"
  │   └── remarks: "First visit"
  │
  ├── Document: auto-generated-id-2
  │   ├── date: "2024-01-15"
  │   ├── weekday: "Monday"
  │   ├── time: "10:00"
  │   └── ... (other fields)
  │
  └── ... (more appointments)

Collection: "2024-01-16"
  ├── Document: auto-generated-id-3
  │   ├── date: "2024-01-16"
  │   ├── weekday: "Tuesday"
  │   └── ... (other fields)
  │
  └── ... (more appointments)
```

## Tips for Preparing Your Excel File

1. **Consistent Date Format**: Use YYYY-MM-DD format for dates
2. **Fill First Occurrence**: Always fill the date and weekday for the first appointment of each day
3. **Time Format**: Use 24-hour format (e.g., 14:00 instead of 2:00 PM)
4. **No Special Characters**: Avoid special characters in IDs and names if possible
5. **Phone Numbers**: Can include spaces or dashes (e.g., "1234-5678" or "1234 5678")

## Validation Checklist

Before importing, verify:

- [ ] First row contains headers
- [ ] Date column (A) has dates for the first appointment of each day
- [ ] Weekday column (B) matches the dates
- [ ] Time column (C) is filled for all appointments
- [ ] No completely empty rows in the middle of data
- [ ] File is saved as .xlsx format
- [ ] File is named `MFW.xlsx` and placed in the project root directory

## Re-importing Data

If you need to re-import data:

1. **Clear existing data** in Firestore (if needed)
   - Go to Firebase Console → Firestore Database
   - Delete collections manually or use Firebase CLI

2. **Update Excel file** with new data

3. **Run import script** again:
   ```bash
   npm run import-data
   ```

Note: The import script creates new documents each time. It does not update existing documents.

