# In-App Feedback Setup Guide

This guide walks you through setting up the new in-app feedback system that replaces the mailto: email links.

## What Changed

- ✅ Feedback form is now **in-app** (no external email client needed)
- ✅ Collects **rating, category, and message**
- ✅ Sends directly to your Gmail inbox
- ✅ No more "Unable to open URL" errors

## Components Added

### Frontend (React Native)
- `FeedbackForm.jsx` - Modal form component
- Updated `SettingsScreen.tsx` - Integrated feedback button

### Backend (Node.js/Express)
- `backend/server.js` - Express server with Gmail SMTP
- `backend/package.json` - Dependencies
- `backend/.env.example` - Environment template
- `backend/README.md` - Full backend documentation

## Quick Start (3 Steps)

### Step 1: Set Up Gmail App Password

1. Go to https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down and click **App passwords**
5. Select "Mail" → "Windows Computer" (or your device)
6. Copy the 16-character password Google generates

### Step 2: Configure Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
GMAIL_USER=brandon.bach44@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PORT=3000
NODE_ENV=development
```

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Word Games Backend running on http://localhost:3000
```

## Development Workflow

**Terminal 1 - Start Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Start React App:**
```bash
npm start
# Then press 'i' for iOS simulator
```

## Testing the Feedback Form

1. Open the app in the simulator
2. Go to **Settings** → **Send Feedback**
3. Fill out the form (all fields required)
4. Click **Send**
5. Check your Gmail inbox for the feedback email

## For Production Deployment

When you're ready to deploy:

1. **Deploy backend** to a hosting service (Railway, Render, Vercel, etc.)
2. **Get the production URL** (e.g., `https://wordgames-api.railway.app`)
3. **Update the app** - Set `BACKEND_URL` in `SettingsScreen.tsx`:

```typescript
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
```

Create `.env.local` in your app root:
```
EXPO_PUBLIC_BACKEND_URL=https://wordgames-api.railway.app
```

## Files Modified

- ✏️ `src/shared/SettingsScreen.tsx` - Added feedback modal state & import
- ✏️ `FeedbackForm.jsx` - New component (mobile-friendly)
- ✏️ `backend/` - New backend folder with server

## Environment Variables

**App (.env.local):**
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Backend (.env):**
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PORT=3000
NODE_ENV=development
```

## Troubleshooting

### "Network error. Check your backend connection."
- Is the backend running? (Check Terminal 1)
- Is the `BACKEND_URL` correct in SettingsScreen.tsx?
- Are they on the same network (localhost works for simulator on same machine)?

### Emails not sending?
- Check `.env` has correct Gmail and app password
- Verify the password is 16 characters (with spaces)
- Check server logs for error messages

### "Gmail App password not working"
- Make sure 2-Step Verification is enabled on your Gmail account
- App passwords only work with 2-Step enabled
- Generate a new one from https://myaccount.google.com/apppasswords

### iOS Simulator Can't Connect to localhost:3000?
- The simulator on macOS can access `localhost` directly
- If on Windows/Android, use your machine's IP address instead:
  - Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
  - Update: `http://192.168.x.x:3000`

## Git Considerations

Add to `.gitignore` (if not already there):
```
backend/.env
backend/node_modules/
```

Never commit `.env` files with real credentials!

## What Happens When User Submits Feedback?

1. User fills form in Settings
2. Clicks "Send" → form validates & shows loading spinner
3. App sends POST to `http://localhost:3000/api/feedback` with:
   ```json
   {
     "rating": 5,
     "category": "feature",
     "message": "Great app!",
     "timestamp": "2024-12-20T10:30:00Z"
   }
   ```
4. Backend receives, formats email, sends via Gmail SMTP
5. Your inbox gets email with all feedback details
6. User sees success message, form closes

## Next Steps

1. ✅ Complete the 3-step Quick Start above
2. ✅ Test feedback form in simulator
3. ✅ Check Gmail for incoming feedback emails
4. ✅ When ready to release, deploy backend to production
5. ✅ Update app with production backend URL

## Need Help?

See `backend/README.md` for detailed backend documentation and deployment options.
