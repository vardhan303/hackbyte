# MongoDB Setup Guide

## The Issue
The error "Operation `users.findOne()` buffering timed out after 10000ms" occurs because:
1. MongoDB connection string was missing in the `.env` file
2. MongoDB server might not be running locally

## Solution Applied

### 1. Environment Configuration
Created `.env` file with default MongoDB connection:
```
MONGO_URI=mongodb://localhost:27017/hackathon_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3001
PORT=5000
```

### 2. Improved Connection Handling
- Added MONGO_URI validation
- Disabled mongoose buffering to prevent timeout errors
- Added connection event handlers
- Added health check endpoint at `/api/health`

## Next Steps

### Option 1: Use Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation instructions for Windows

2. **Start MongoDB Service**
   ```powershell
   # Check if MongoDB service is running
   Get-Service -Name MongoDB
   
   # Start MongoDB service
   Start-Service MongoDB
   ```

3. **Verify MongoDB is Running**
   ```powershell
   # Check MongoDB status
   mongosh
   ```

4. **Start the Backend Server**
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

### Option 2: Use MongoDB Atlas (Cloud Database)

1. **Create a Free MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free cluster

2. **Get Your Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

3. **Update .env File**
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hackathon_db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   FRONTEND_URL=http://localhost:3001
   PORT=5000
   ```

4. **Start the Backend Server**
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

## Testing the Setup

1. **Check MongoDB Connection**
   ```
   http://localhost:5000/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2026-04-17T..."
   }
   ```

2. **Test Login**
   - Navigate to your frontend login page
   - Try logging in with your credentials

## Troubleshooting

### MongoDB Not Running (Local)
```powershell
# Start MongoDB service
Start-Service MongoDB

# If service doesn't exist, start mongod manually
mongod --dbpath C:\data\db
```

### Connection Still Failing
1. Check if `.env` file exists in `backend` folder
2. Verify MONGO_URI is correct
3. Check firewall settings
4. Review console logs for specific error messages

### Create Admin User (First Time Setup)
```powershell
cd backend
npm run seed:admin
```
This creates an admin user with:
- Email: admin@hackathon.com
- Password: admin123
