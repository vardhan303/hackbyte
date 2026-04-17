# Deploy Backend to Vercel - Step by Step

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have your MongoDB Atlas connection string ready

## Deployment Steps

### Step 1: Login to Vercel
```bash
cd c:\Users\laksh\Downloads\hackathon_web\backend
vercel login
```

### Step 2: Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Choose your account
- **Link to existing project?** No
- **Project name?** hackathon-backend
- **Directory?** ./
- **Override settings?** No

### Step 3: Add Environment Variables
After first deployment, add environment variables:

```bash
vercel env add MONGO_URI
# Paste: mongodb+srv://lakshmivardhangosu2005_db_user:Kwr2F56wqUazFJDX@cluster0.f1ez3mj.mongodb.net/hackathon_db?retryWrites=true&w=majority

vercel env add JWT_SECRET
# Paste: your_super_secret_jwt_key_change_this_in_production

vercel env add FRONTEND_URL
# Paste: http://localhost:3001 (or your frontend URL)

vercel env add VERCEL
# Paste: true
```

### Step 4: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 5: Get Your Production URL
```bash
vercel ls
```

Your backend will be at: `https://your-project-name.vercel.app`

---

## MongoDB Atlas Configuration

### Whitelist Vercel IP Addresses (IMPORTANT!)

MongoDB Atlas needs to allow connections from Vercel servers:

1. Go to: https://cloud.mongodb.com/
2. Navigate to: **Security** → **Network Access**
3. Click **"+ ADD IP ADDRESS"**
4. Choose one of these options:

   **Option 1 (Easiest for Development):**
   - Click **"ALLOW ACCESS FROM ANYWHERE"**
   - This adds `0.0.0.0/0`
   - Click **"Confirm"**

   **Option 2 (More Secure):**
   - Add Vercel's IP ranges:
     ```
     3.217.0.0/16
     3.234.0.0/16
     44.192.0.0/16
     52.200.0.0/16
     54.84.0.0/16
     ```
   - Or use `0.0.0.0/0` to allow all IPs

5. Wait 1-2 minutes for changes to apply

---

## Verify Deployment

### Test Your Backend
```bash
# Replace with your actual Vercel URL
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-04-17T..."
}
```

### Check Logs
```bash
vercel logs
```

---

## Update Frontend

After deploying backend, update your frontend's environment variable:

### For Next.js Frontend:
Edit `frontend-nextjs/.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

### For React Frontend:
Edit `frontend/.env`:
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

Then redeploy your frontend to Vercel as well.

---

## Common Issues

### Issue 1: MongoDB Connection Fails on Vercel
**Solution:** 
- Check MongoDB Atlas Network Access - add `0.0.0.0/0`
- Verify MONGO_URI environment variable in Vercel
- Check Vercel logs: `vercel logs`

### Issue 2: CORS Errors
**Solution:**
- Update FRONTEND_URL environment variable in Vercel
- The backend already has CORS configured for Vercel domains

### Issue 3: Environment Variables Not Working
**Solution:**
- Redeploy after adding environment variables
- Check variables in Vercel Dashboard → Project Settings → Environment Variables
- Ensure variables are added to correct environment (Production/Preview/Development)

---

## Environment Variables Summary

| Variable | Value | Required |
|----------|-------|----------|
| MONGO_URI | Your MongoDB Atlas connection string | ✅ Yes |
| JWT_SECRET | Your secret key for JWT tokens | ✅ Yes |
| FRONTEND_URL | Your frontend URL | ✅ Yes |
| PORT | 5000 (Vercel will override) | Optional |
| VERCEL | true | ✅ Yes |

---

## Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# List environment variables
vercel env ls
```
