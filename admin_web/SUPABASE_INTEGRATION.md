# BloodLink Admin Web - Supabase Integration

## Overview

This document summarizes the implementation of authentication and authorization for the BloodLink admin web application using Supabase.

## Architecture

### Key Files Created

#### 1. **src/types/database.ts**
Database type definitions matching the Supabase schema:
- `UserRole`: 'donor' | 'center_admin' | 'super_admin'
- `BloodType`, `UrgencyLevel`, `AlertStatus`, `AppointmentStatus`, `DonationStatus`, `NotificationType` enums
- Interfaces: `Profile`, `Center`, `Alert`, `Appointment`, `Donation`, `Notification`, `AdminContext`

#### 2. **src/lib/supabase.ts**
Supabase browser client configuration:
- Uses `createBrowserClient` from `@supabase/ssr`
- Only uses public environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No service_role key is used

#### 3. **src/lib/auth.ts**
Authentication functions:
- `signIn(email, password)` - Sign in with email and password
- `signOut()` - Sign out user
- `getSession()` - Get current session
- `getProfile()` - Fetch user profile from database
- `getCurrentAdminContext()` - Get full admin context with center info for center_admin
- Role helpers: `isCenterAdmin()`, `isSuperAdmin()`, `isAllowedAdminRole()`

#### 4. **src/components/ProtectedAdminLayout.tsx**
Protected wrapper component:
- Checks session on mount
- Validates role (must be center_admin or super_admin)
- Blocks donors and inactive users
- Prevents infinite re-render loops with proper dependency handling
- Shows loading and error states

#### 5. **src/app/login/page.tsx**
Login page features:
- Email/password authentication
- Role validation after login
- Blocks donor access with clear message
- Redirects to `/admin/dashboard` for valid admin roles
- Test account helper text

#### 6. **src/app/admin/layout.tsx**
Admin layout with sidebar:
- Navigation links for all features
- Role-specific visibility (Centers page for super_admin only)
- Logout functionality

#### 7. **src/app/admin/dashboard/page.tsx**
Dashboard showing role-specific stats:
- **center_admin**: Own center alerts, pending/completed appointments, validated donations
- **super_admin**: Active centers, global alerts, total appointments, total donations

#### 8. **src/app/admin/alerts/page.tsx**
Alert management:
- **center_admin**: Create, view own center alerts
- **super_admin**: View all alerts
- Form with blood type, urgency level, radius, message, deadline

#### 9. **src/app/admin/appointments/page.tsx**
Appointment management:
- **center_admin**: View own center appointments
- **super_admin**: View all appointments
- Status dropdown (pending, confirmed, cancelled, completed)
- Donor information display

#### 10. **src/app/admin/donations/page.tsx**
Donation management:
- **center_admin**: View own center donations, validate/reject pending donations
- **super_admin**: View all donations
- Validation sets: `validated_by`, `validated_at`, status='validated'
- Automatic donor eligibility calculation via RLS trigger

#### 11. **src/app/admin/statistics/page.tsx**
Statistics dashboard:
- **center_admin**: Center-specific metrics
- **super_admin**: Global metrics including centers and donors

#### 12. **src/app/admin/centers/page.tsx**
Center management (super_admin only):
- Create new centers
- View all centers
- Toggle active/inactive status
- Assign admin_id if needed

#### 13. **.env.example**
Environment variables template:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Authentication Flow

1. **Unauthenticated user** → Redirected to `/login`
2. **Login form** → Calls `signIn(email, password)`
3. **Session created** → Fetch profile from database
4. **Role validation**:
   - If `role = donor` → Sign out, show error, redirect to login
   - If `is_active = false` → Sign out, redirect to login
   - If `role = center_admin` or `super_admin` → Grant access
5. **For center_admin** → Fetch their center using `centers.admin_id = auth.user.id`
6. **Access granted** → Render admin layout with context

## Authorization Rules

### center_admin
- ✅ Access `/admin` routes
- ✅ View own center data only
- ✅ Create alerts for own center
- ✅ Update appointments for own center
- ✅ Validate/reject donations for own center
- ❌ Cannot access `/admin/centers`
- ❌ Cannot see other centers' data

### super_admin
- ✅ Access all `/admin` routes
- ✅ View all centers, alerts, appointments, donations
- ✅ Create, edit, deactivate centers
- ✅ Manage all data globally
- ✅ View statistics for all centers

### donor
- ❌ Cannot access `/admin` routes
- ❌ Blocked at login with clear message
- ✅ Uses mobile_app instead

## Key Implementation Details

### RLS (Row Level Security)
- RLS policies are already in place in Supabase
- Frontend performs additional filtering for clarity
- No service_role key is used - all queries respect RLS

### Data Filtering
- **center_admin queries** include `.eq('center_id', adminContext.center.id)`
- **super_admin queries** have no center filter (naturally see all via RLS)
- Arrays are safely checked with `Array.isArray()` fallback

### No Breaking Changes
- Mobile app unchanged
- Supabase migration unchanged
- Shared types updated if needed
- Only modified `admin_web`

## Database Schema Alignment

### Tables Used
- `profiles` - User profiles with role
- `centers` - Blood centers with admin_id
- `alerts` - Blood shortage alerts
- `appointments` - Donor appointments
- `donations` - Blood donations with validation
- `notifications` - User notifications

### Exact Field Names
- `blood_type_required` (not blood_group)
- `urgency_level` (not urgency)
- `scheduled_date` (not appointment_at)
- `donation_date` (not date_of_donation)
- `validated_by`, `validated_at` (timestamp fields)

## Environment Setup

### 1. Install dependencies
```bash
cd admin_web
npm install
```

### 2. Create .env.local
```bash
cp .env.example .env.local
# Edit with your Supabase credentials
```

### 3. Run development server
```bash
npm run dev
# Open http://localhost:3000
```

## Testing Checklist

### Test 1: center_admin Login & Access
1. Login with center_admin test account
2. ✅ Dashboard shows only own center data
3. ✅ Alerts page shows only own center alerts
4. ✅ Can create new alert
5. ✅ Appointments show own center only
6. ✅ Centers page NOT visible in sidebar

### Test 2: super_admin Login & Access
1. Login with super_admin test account
2. ✅ Dashboard shows global stats
3. ✅ Alerts page shows all alerts
4. ✅ Appointments page shows all appointments
5. ✅ Centers page visible in sidebar
6. ✅ Can create/manage centers

### Test 3: donor Blocked
1. Attempt login with donor account
2. ✅ Error message: "Accès réservé aux centres et administrateurs."
3. ✅ Automatically signed out
4. ✅ Redirected to login

### Test 4: Inactive User Blocked
1. Manually set profile `is_active = false` in Supabase
2. Attempt login with that account
3. ✅ Auto sign out
4. ✅ Redirected to login

### Test 5: Role Changes
1. Change profile role in Supabase from center_admin to super_admin
2. Refresh page or logout/login
3. ✅ Centers page now appears
4. ✅ Dashboard shows global stats

## Security Considerations

✅ **Implemented**
- No hardcoded user IDs
- No hardcoded center IDs
- No service_role key in frontend
- Session-based auth only
- RLS enforced at database level
- Role validation on every page
- Inactive users blocked immediately

⚠️ **Note**
- center_admin can only see their own center via RLS + frontend filter
- super_admin naturally sees all due to RLS policies
- All mutations respect RLS

## Troubleshooting

### "Profile not found" error
- Ensure trigger `on_auth_user_created` exists in Supabase
- Check if profile is manually created for test users
- Verify profile.is_active = true

### "Not authenticated" on refresh
- Session might have expired
- User will be redirected to /login
- Supabase maintains session via cookie/localStorage

### Center not found for center_admin
- Check if profile.admin_id is set correctly
- Verify center exists with matching admin_id
- Check RLS policies for centers table

### Donations validation not working
- Ensure user has profile.id (not null)
- Verify center_admin is assigned to the right center
- Check trigger `on_donation_validated` in Supabase

## Future Enhancements

- [ ] Role management page (assign/remove admin roles)
- [ ] Donor management page with filters
- [ ] Export data to CSV/PDF
- [ ] Real-time notifications via WebSocket
- [ ] Bulk donation validation
- [ ] Map view of centers and alerts
- [ ] Audit logs for all actions
- [ ] Two-factor authentication

## References

- Database schema: `supabase/migrations/00001_initial.sql`
- Supabase docs: https://supabase.com/docs
- Next.js 15 docs: https://nextjs.org/docs
