# Word Games Backend - Feedback Server

Simple Node.js/Express server that receives feedback from the Word Games app and sends it to your Gmail inbox.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Gmail App Password

You need to set up a Gmail App Password to allow the server to send emails:

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Navigate to **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled
4. Find **App passwords** (should appear below 2-Step Verification)
5. Select "Mail" and "Windows Computer" (or your device type)
6. Google will generate a 16-character password
7. Copy this password

### 3. Create `.env` File

Create a `.env` file in the backend directory (copy from `.env.example`):

```bash
# Gmail Configuration
GMAIL_USER=brandon.bach44@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password

# Server
PORT=3000
NODE_ENV=development
```

**Important:** Never commit `.env` to version control. It contains sensitive credentials.

### 4. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3000`.

## API Endpoints

### Health Check
```
GET /health
```

### Submit Feedback
```
POST /api/feedback
Content-Type: application/json

{
  "rating": 5,
  "category": "feature",
  "message": "Love this app!",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Feedback sent successfully!"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to send feedback. Please try again later."
}
```

## Connect from React App

Update the `BACKEND_URL` in `SettingsScreen.tsx`:

**Development (local machine):**
```typescript
const BACKEND_URL = 'http://localhost:3000';
```

**Production (deployed server):**
```typescript
const BACKEND_URL = 'https://your-production-url.com';
```

Or use environment variables:
```typescript
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
```

Create a `.env.local` file in the app root:
```
EXPO_PUBLIC_BACKEND_URL=https://your-production-url.com
```

## Deployment

### Using Heroku (Free Option Deprecated)
Consider alternatives like Railway, Render, or Vercel:

1. **Railway:** https://railway.app
2. **Render:** https://render.com
3. **Vercel:** https://vercel.com

### Environment Variables on Host
Set these on your hosting platform's dashboard:
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `PORT` (usually auto-assigned)
- `NODE_ENV=production`

## Troubleshooting

**"Less secure apps" error?**
- Gmail no longer supports "Less secure apps"
- Use App Passwords instead (see Setup step 2)

**Can't connect from React app?**
- Check CORS is enabled (it is by default)
- Verify backend URL matches your server's actual URL
- Check firewall/network settings

**Emails not arriving?**
- Check `.env` file has correct Gmail and app password
- Verify Gmail account can send emails
- Check spam/junk folder
- Review server logs for errors

## File Structure

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Your credentials (DO NOT COMMIT)
├── .env.example       # Template for .env
└── README.md          # This file
```
