# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### 1. Install Dependencies

```bash
cd /home/quantum/Documents/GKM/AutonomousProcurementAgent

# Install all workspaces
npm install

# Install specific workspaces
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Get API Keys

#### Gemini API Key (Required for Demo)
1. Visit https://ai.google.dev/
2. Click "Get API key in Google AI Studio"
3. Create a new project
4. Generate API key
5. Copy the key

#### SKALE Network (Optional for Local Demo)
- For local testing, you can use Hardhat's local network
- For actual SKALE deployment, get testnet RPC from https://skale.network/

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your API key
nano .env
```

**Minimum required for local demo:**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Compile Contracts (Optional for First Demo)

```bash
cd contracts
npm run compile
cd ..
```

**Note**: For a quick demo without blockchain deployment, the system can run with mock data.

### 5. Start the Application

#### Option A: Run Everything at Once
```bash
# From project root
npm run dev
```

#### Option B: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open and Test

1. Open browser: **http://localhost:3000**
2. Fill in the procurement form with sample data
3. Click "Start Autonomous Procurement"
4. Watch the AI work its magic! 🤖✨

### 🎯 Sample Test Data

Use these values for a quick demo:

- **Procurement Brief**: "We need access to a blockchain analytics API for monitoring transactions"
- **Max Budget**: $500
- **Min Quality Score**: 7.0
- **Preferred SLA**: 99.0%
- **Duration**: 30 days

Expected result: AI will select **BlockInsight API** or **ChainMetrics Pro** based on criteria.

## ⚠️ Troubleshooting

### "GEMINI_API_KEY not found"
- Make sure you created `.env` file in project root
- Verify the API key is correct
- Restart the backend server

### "Cannot connect to backend"
- Check backend is running on port 3001
- Verify NEXT_PUBLIC_API_URL in frontend `.env`
- Check for port conflicts

### "Contracts not initialized"
- This is OK for initial demo
- The app will work without deployed contracts
- For full blockchain demo, deploy contracts first

### TypeScript Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

## 📚 Next Steps

After successful local demo:

1. **Deploy Contracts to SKALE**
   ```bash
   cd contracts
   npm run deploy
   ```

2. **Update Contract Addresses**
   - Copy addresses from deployment output
   - Add to `.env` file

3. **Test Full Blockchain Flow**
   - Restart services
   - Run end-to-end procurement

4. **Customize Vendors**
   - Edit `backend/src/data/VendorData.ts`
   - Add your own vendor data

## 🎥 Demo Tips

For the best demo experience:

1. **Use incognito/private browser window** (clean state)
2. **Keep developer console open** (see real-time logs)
3. **Screen record the flow** (< 1 minute end-to-end)
4. **Highlight the AI reasoning** (show Gemini's analysis)
5. **Emphasize privacy** (encrypted budget constraints)

## ✅ Success Checklist

- [ ] Dependencies installed successfully
- [ ] Gemini API key configured
- [ ] Backend server running (port 3001)
- [ ] Frontend server running (port 3000)
- [ ] Can submit procurement request
- [ ] AI evaluation completes
- [ ] Vendor selection shows
- [ ] Workflow completes successfully

**You're ready to wow the hackathon judges!** 🏆
