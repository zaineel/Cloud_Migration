# MavPrep AWS Amplify Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ AWS Account with appropriate permissions
- ✅ GitHub repository with your code
- ✅ AWS Cognito User Pool configured
- ✅ DynamoDB table created with GSI1 index
- ✅ IAM user with DynamoDB access (for API routes)

---

## 🚀 Step 1: Deploy to AWS Amplify

### 1.1 Connect Your Repository

1. **Go to AWS Amplify Console:**
   - https://console.aws.amazon.com/amplify
   - Select your region (e.g., us-east-1)

2. **Create New App:**
   - Click **"New app" → "Host web app"**
   - Choose **GitHub** as the source
   - Authorize AWS Amplify to access your GitHub account
   - Select repository: `zaineel/Cloud_Migration`
   - Select branch: `main` (or your main branch)

3. **Configure Build Settings:**
   - Amplify should auto-detect Next.js
   - It will use the `amplify.yml` file we created
   - App name: `MavPrep` (or your choice)
   - Environment: `production`

4. **Click "Next" and then "Save and Deploy"**

### 1.2 Add Environment Variables

After the app is created, add environment variables:

1. **In Amplify Console:**
   - Go to your app → **"App settings" → "Environment variables"**
   - Click **"Manage variables"**

2. **Add these variables:**

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID = us-east-1_Kl5wGaCms
NEXT_PUBLIC_COGNITO_CLIENT_ID = 9ku8gqluh7409ba3k5nmmrgg2
NEXT_PUBLIC_AWS_REGION = us-east-1
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = AKIAXXXXXXXXX (your IAM access key)
AWS_SECRET_ACCESS_KEY = xxxxxxxxxx (your IAM secret key)
DYNAMODB_TABLE_NAME = MavPrepData
```

3. **Get your Amplify URL:**
   - After deployment completes, you'll get a URL like:
   - `https://main.d1234567890abc.amplifyapp.com`

4. **Add the production URL:**
   - Go back to Environment variables
   - Add: `NEXT_PUBLIC_APP_URL = https://main.d1234567890abc.amplifyapp.com`
   - Click **"Save"**

5. **Redeploy:**
   - Click **"Redeploy this version"** to apply the new environment variable

---

## ⚠️ Step 2: Critical Socket.IO / WebRTC Configuration

**IMPORTANT:** AWS Amplify hosting does NOT support WebSocket connections or Socket.IO directly!

### The Problem

- Voice/video calling uses Socket.IO for WebRTC signaling
- Amplify only supports static hosting (no WebSocket server)
- Your `/pages/api/webrtc-signaling.ts` won't work in production on Amplify

### Solution: Deploy Socket.IO Server Separately

You have 3 options:

#### **Option 1: AWS EC2 (Recommended)**

1. **Create EC2 instance:**
   - Launch t2.micro (free tier eligible)
   - Ubuntu 22.04 LTS
   - Security group: Allow ports 22, 80, 443, 3001

2. **Deploy Socket.IO server:**
   ```bash
   # SSH into EC2
   ssh ubuntu@your-ec2-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Create server directory
   mkdir socket-server && cd socket-server
   npm init -y
   npm install socket.io cors
   ```

3. **Create server file** (`server.js`):
   ```javascript
   const { Server } = require('socket.io');
   const http = require('http');

   const server = http.createServer();
   const io = new Server(server, {
     cors: {
       origin: [
         'http://localhost:3000',
         'https://main.d1234567890abc.amplifyapp.com', // Your Amplify URL
       ],
       methods: ['GET', 'POST'],
       credentials: true
     }
   });

   const socketToUser = new Map();

   io.on('connection', (socket) => {
     console.log('Client connected:', socket.id);

     // Copy your webrtc-signaling.ts logic here
     // ... (all socket event handlers)
   });

   const PORT = process.env.PORT || 3001;
   server.listen(PORT, () => {
     console.log(`Socket.IO server running on port ${PORT}`);
   });
   ```

4. **Run with PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

5. **Update your app:**
   - In Amplify environment variables, add:
   - `NEXT_PUBLIC_SOCKET_URL = http://your-ec2-ip:3001`

#### **Option 2: Railway / Render (Easier)**

1. **Create free account:** https://railway.app or https://render.com
2. **Create new project** from your GitHub repo
3. **Set build command:** `npm install`
4. **Set start command:** `node socket-server.js`
5. **Deploy** - you'll get a URL like: `https://your-app.railway.app`
6. **Add to Amplify env vars:** `NEXT_PUBLIC_SOCKET_URL = https://your-app.railway.app`

#### **Option 3: AWS Lambda + API Gateway WebSockets (Advanced)**

- Use AWS Lambda with API Gateway WebSocket API
- More complex setup but serverless (scales automatically)
- See AWS documentation: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html

---

## 🔒 Step 3: Security Configuration

### Update Cognito Allowed Callback URLs

1. **Go to AWS Cognito Console:**
   - Select your User Pool
   - Go to **"App integration" → "App client settings"**

2. **Add Amplify URL to allowed callbacks:**
   ```
   https://main.d1234567890abc.amplifyapp.com/home
   https://main.d1234567890abc.amplifyapp.com/login
   ```

3. **Add to allowed sign-out URLs:**
   ```
   https://main.d1234567890abc.amplifyapp.com/login
   ```

### Update CORS for DynamoDB API Routes

Your API routes already have proper AWS credentials, no changes needed!

---

## 📝 Step 4: Update Next.js Configuration

### Update Socket.IO Client Connection

In `app/home/page.tsx` (around line 520), update the Socket.IO connection:

**Before:**
```javascript
const socket = io({
  path: "/api/webrtc-signaling",
  transports: ["websocket", "polling"],
});
```

**After:**
```javascript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
const socket = io(socketUrl, {
  path: "/socket.io", // Changed from /api/webrtc-signaling
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
});
```

---

## ✅ Step 5: Verify Deployment

### Test Checklist

1. **Authentication:**
   - [ ] Can sign up new users
   - [ ] Can sign in existing users
   - [ ] Can reset password
   - [ ] Redirects work correctly

2. **Text Channels:**
   - [ ] Can view channels
   - [ ] Can send messages
   - [ ] Messages persist (DynamoDB working)

3. **Voice Channels (if Socket.IO server deployed):**
   - [ ] Can join voice channel
   - [ ] Can hear other users
   - [ ] Mute/unmute works
   - [ ] Video toggle works

4. **Settings:**
   - [ ] Can update username
   - [ ] Can update description
   - [ ] Can change password

### Monitoring

1. **Amplify Console:**
   - Check build logs for errors
   - Monitor deployment status

2. **CloudWatch Logs:**
   - API routes log to CloudWatch
   - Check for DynamoDB errors

3. **Browser Console:**
   - Check for Cognito errors
   - Check Socket.IO connection status

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** "Module not found" error
**Solution:**
- Ensure all dependencies are in `package.json`
- Check `amplify.yml` has correct build commands

### Authentication Not Working

**Problem:** "User pool not configured"
**Solution:**
- Verify environment variables are set correctly
- Check NEXT_PUBLIC_ prefix for client-side vars
- Redeploy after adding variables

### DynamoDB Errors

**Problem:** "Access denied" or "Table not found"
**Solution:**
- Verify IAM user has DynamoDB permissions
- Check AWS_REGION matches DynamoDB table region
- Ensure table name matches DYNAMODB_TABLE_NAME

### Voice/Video Not Working

**Problem:** Can't connect to voice channel
**Solution:**
- Deploy separate Socket.IO server (see Step 2)
- Update NEXT_PUBLIC_SOCKET_URL environment variable
- Check CORS configuration on Socket.IO server

### "GSI1 not available" Warning

**Problem:** Slow channel loading
**Solution:**
- Add GSI1 index to DynamoDB table (see scripts/create-dynamodb-table.md)
- Wait for index to become ACTIVE

---

## 🔄 Continuous Deployment

Once set up, Amplify will automatically:
- Deploy on every push to `main` branch
- Run build process
- Update live site (no downtime)

**To trigger manual deployment:**
1. Go to Amplify Console
2. Click your app → "Deployments"
3. Click "Redeploy this version"

---

## 💰 Cost Estimate

**AWS Amplify Hosting:**
- Free tier: 1,000 build minutes/month, 15 GB served/month
- After free tier: ~$0.01/build minute, ~$0.15/GB served

**Socket.IO Server (EC2 t2.micro):**
- Free tier: 750 hours/month for 12 months
- After free tier: ~$8/month

**DynamoDB:**
- Free tier: 25 GB storage, 25 WCU, 25 RCU
- Likely stays in free tier for small usage

**Total:** $0-15/month depending on usage

---

## 📚 Next Steps

After deployment:
1. Set up custom domain (optional)
2. Enable SSL certificate (automatic with Amplify)
3. Configure monitoring and alerts
4. Set up backup strategy for DynamoDB
5. Implement error tracking (Sentry, etc.)

---

## 🆘 Need Help?

- **Amplify Docs:** https://docs.aws.amazon.com/amplify/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Socket.IO:** https://socket.io/docs/v4/

**Created:** 2025-12-29
**Last Updated:** 2025-12-29
