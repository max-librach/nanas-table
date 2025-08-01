# My Family Feature

## Overview
The "My Family" page is a new feature that displays family members and their information. This serves as a foundation for future user management and family calendar features.

## Features

### Current Features
- **Family Member Display**: Shows name, email, birthdate, and photo/avatar
- **Responsive Design**: Works on desktop and mobile
- **Add Family Members**: Admin functionality to add new family members
- **Status Indicators**: Shows active/inactive status for each member

### Future Features (Planned)
- **User Management**: Replace hardcoded whitelist with dynamic family member data
- **Birthday Events**: Automatic birthday event creation based on birthdates
- **Family Calendar**: Integration with calendar features
- **Leaderboards**: Track photos uploaded, comments left, etc.
- **Photo Uploads**: Allow family members to upload their own photos

## Data Structure

### FamilyMember Interface
```typescript
interface FamilyMember {
  id: string;
  name: string;
  email: string;
  birthdate?: string;
  photoURL?: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Firebase Integration

### Collections
- `familyMembers`: Stores family member data
- Uses soft deletes (isActive flag) instead of hard deletes

### Security Rules
The family members collection should have appropriate security rules:
```javascript
match /familyMembers/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    request.auth.token.email in ['admin@email.com']; // Restrict to admins
}
```

## Migration from Hardcoded Data

### Current State
The app currently uses hardcoded family members in `src/constants/index.ts`:
```typescript
export const FAMILY_MEMBERS = {
  'maxlibrach@gmail.com': 'Max',
  'ashley.maheris@gmail.com': 'Ashley',
  // ... etc
}
```

### Migration Steps
1. **Populate Firestore**: Use the migration utility to add existing family members
2. **Update AuthContext**: Modify authentication to use Firestore data instead of constants
3. **Test Authentication**: Ensure all existing users can still sign in
4. **Remove Constants**: Clean up hardcoded data once migration is complete

### Migration Utility
Use the browser console to run the migration:
```javascript
// In browser console
import('./src/utils/migrateFamilyMembers.ts').then(module => {
  module.migrateFamilyMembers();
});
```

## Usage

### Adding a Family Member
1. Navigate to "My Family" page
2. Click "Add Family Member" button
3. Fill in the required information:
   - Name (required)
   - Email (required)
   - Birthdate (optional)
   - Role (optional)
4. Click "Add Member"

### Viewing Family Members
- All family members are displayed in a card layout
- Shows avatar (initials if no photo), name, email, birthdate
- Status badge indicates if member is active

## Technical Implementation

### Components
- `MyFamilyPage`: Main page component
- `AddFamilyMemberModal`: Modal for adding new members
- `migrateFamilyMembers.ts`: Utility for data migration

### Services
- `getFamilyMembers()`: Fetch all active family members
- `addFamilyMember()`: Add new family member
- `updateFamilyMember()`: Update existing member
- `deleteFamilyMember()`: Soft delete member

### Navigation
- Added to main navigation in Header component
- Route: `/family`
- Protected by PrivateRoute (requires authentication)

## Next Steps

1. **Populate Data**: Add existing family members to Firestore
2. **Update Authentication**: Modify AuthContext to use Firestore data
3. **Add Admin Controls**: Implement edit/delete functionality
4. **Photo Upload**: Allow family members to upload profile photos
5. **Birthday Integration**: Connect birthdates to event creation
6. **Calendar Features**: Build family calendar functionality
7. **Leaderboards**: Track and display family member activity

## Security Considerations

- Family member data should be private to authenticated users
- Admin functions (add/edit/delete) should be restricted
- Email addresses should be validated and normalized
- Birthdates should be stored in ISO format for consistency 