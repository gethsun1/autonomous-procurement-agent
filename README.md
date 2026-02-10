# Autonomous Procurement Agent

> **SKALE x402 Hackathon Project**

An end-to-end autonomous procurement system combining AI decision-making (Google Gemini), privacy-preserving execution (SKALE BITE), and on-chain settlement (x402 + AP2).

## 🎯 Overview

This project demonstrates how an AI agent can autonomously:
1. **Receive** a corporate procurement request
2. **Evaluate** vendor offers using Gemini AI
3. **Decide** under encrypted constraints (privacy-preserving)
4. **Execute** payment via SKALE x402
5. **Settle** transaction via AP2

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js Dashboard
│   (Next.js)     │  - Submit requests
└────────┬────────┘  - Monitor progress
         │           - View settlements
         │
┌────────▼────────┐
│   Backend       │  Node.js Agent Orchestrator
│   (Node/TS)     │  - State machine
└────┬───────┬────┘  - Gemini integration
     │       │       - Blockchain calls
     │       │
┌────▼───┐ ┌▼──────────────┐
│ Gemini │ │ Smart Contracts│
│ AI API │ │  (Solidity)    │
└────────┘ │  - ERC-8004    │
           │  - x402/AP2    │
           │  - Encryption  │
           └────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/gethsun1/autonomous-procurement-agent.git
cd autonomous-procurement-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Development

```bash
# Start all services (frontend + backend)
npm run dev

# Or run individually:
npm run dev --workspace=frontend   # http://localhost:3000
npm run dev --workspace=backend    # http://localhost:3001

# Deploy contracts to SKALE testnet
npm run deploy:contracts
```

## 📦 Project Structure

```
autonomous-procurement-agent/
├── frontend/          # Next.js dashboard
├── backend/           # Agent orchestrator
├── contracts/         # Smart contracts
└── package.json       # Monorepo root
```

## 🔑 Configuration

1. **Get a Gemini API Key**: https://ai.google.dev/
2. **SKALE Testnet Access**: Configure RPC URL in `.env`
3. **Deploy Contracts**: Run deployment script and update contract addresses

## 🎬 Demo Scenario

**Scenario**: API Service Procurement for an AI Startup

1. **Request**: "Need blockchain analytics API for 30 days"
2. **Constraints**: 
   - Max budget: $500 (encrypted)
   - Min quality: 7/10
   - SLA requirement: 99% uptime
3. **Agent Flow**:
   - Discovers 5 vendor offers
   - Gemini evaluates and ranks
   - Selects best vendor under constraints
   - Executes payment (x402)
   - Finalizes settlement (AP2)
4. **Result**: Complete procurement in under 2 minutes, fully autonomous

## 🔐 Privacy Features

- **Encrypted Budget**: Max budget stored encrypted on-chain
- **Private Scoring**: Evaluation weights not publicly visible
- **Selective Disclosure**: Details revealed only post-settlement

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test contracts
npm run test --workspace=contracts

# Test backend
npm run test --workspace=backend
```

## 📚 Technology Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Smart Contracts**: Solidity, Hardhat
- **AI**: Google Gemini 2.0 Flash
- **Blockchain**: SKALE Network (x402, AP2)

## 🏆 Hackathon Highlights

- ✅ Full autonomous workflow (ERC-8004 compliant)
- ✅ AI-powered evaluation (Gemini integration)
- ✅ Privacy-preserving decisions (SKALE BITE)
- ✅ Real on-chain payments (x402)
- ✅ Settlement finality (AP2)
- ✅ Production-ready UI

## 📄 License

MIT

## 👥 Team

Built for SKALE x402 Hackathon

---

**Demo Video**: [Coming Soon]  
**Live Demo**: [Coming Soon]
