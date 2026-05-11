# ZeroPay Confidential

**Confidential AI Payroll for the Web3 Workforce**

ZeroPay is an autonomous payroll system that computes employee salaries privately using Arcium confidential compute, stores all workforce data on 0G decentralized storage, and executes wallet-to-wallet payments every Saturday — with no intermediaries and no platform custody.

Live demo: https://zeropay-confidential.vercel.app

---

## What It Does

- **Employer** connects their wallet, registers a company, and adds employees
- **Attendance** is tracked Mon–Fri during payable hours (9AM–5PM); no weekend clock-ins allowed
- **Arcium Compute** encrypts each employee's salary (weekly hours × hourly rate) and submits an on-chain attestation to the ArciumRegistry contract on 0G Newton Mainnet
- **Sign to Reveal** — employer or employee must sign a wallet message before decrypted salary figures are shown
- **Batch Payroll** executes all payments in a single on-chain transaction via the ZeroPayBatch contract, directly from employer wallet to employee wallets
- **Autonomous Saturday Payroll** — a Vercel Cron job runs every Saturday at 9AM UTC, automatically computing and executing payroll for all companies with auto-pay enabled
- **0G Storage** — all workforce events (registrations, attendance, payroll receipts) are logged to 0G Newton Mainnet decentralized storage
- **Employee Portal** — employees connect via invite link, see their attendance history, and reveal their salary with a wallet signature

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Radix UI |
| Wallet | wagmi v2, viem, WalletConnect |
| Confidential Compute | Arcium (AES-GCM encryption + on-chain attestation) |
| Decentralized Storage | 0G Newton Mainnet Storage Layer |
| Blockchain | 0G Newton Mainnet (Chain ID: 16661) |
| Database | Supabase (Postgres + Realtime) |
| Email | Brevo (employee invite emails) |
| Autonomous Agent | Vercel Cron Jobs (Saturday 9AM UTC) |

---

## Smart Contracts — 0G Newton Mainnet

| Contract | Address |
|---|---|
| ZeroPayBatch | `0x30d01Fc75a734d56214E3949377b2dC539ce6320` |
| ArciumRegistry | `0x3f5f7A59Ee245D537162F212fDf87d4AE4F637e9` |

View on explorer: https://chainscan.0g.ai

**ZeroPayBatch** — Accepts an array of recipient addresses and amounts, distributes native 0G tokens in a single transaction, and emits a `BatchPayment` event.

**ArciumRegistry** — Records `attest(bytes32 computeHash, uint256 employeeCount)` calls on-chain so salary computation results can be verified independently. Salary figures themselves are never stored on-chain.

---

## How Payroll Works

```
1. Employer marks clock in/out for each employee (Mon–Fri)
2. Employer clicks "Run Arcium Compute"
   → Each salary is AES-GCM encrypted with a key derived from the employer's wallet signature
   → A keccak256 hash of all computations is submitted to ArciumRegistry on-chain
3. Employer clicks "Execute Payroll"
   → Decrypted amounts are revealed (requires wallet signature)
   → ZeroPayBatch.batchPay() sends 0G tokens to all employee wallets in one tx
4. Every Saturday 9AM UTC (or manually anytime)
   → Vercel Cron triggers /api/cron/payroll
   → Signer wallet computes and pays all auto-pay enabled companies autonomously
5. After payment, employees are reset to pending on their next clock-in
   so new hours can be tracked and paid the following week
```

---

## Running Locally

```bash
git clone https://github.com/Olalekan2345/zeropay-confidential.git
cd zeropay-confidential
npm install
cp .env.local.example .env.local
# Fill in your values in .env.local
npm run dev
```

Open http://localhost:3000 and connect MetaMask to 0G Newton Mainnet (Chain ID: 16661, RPC: https://evmrpc.0g.ai).

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `BREVO_API_KEY` | Brevo API key for invite emails |
| `BREVO_FROM_EMAIL` | Verified sender email in Brevo |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect cloud project ID |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL |
| `NEXT_PUBLIC_BATCH_CONTRACT` | ZeroPayBatch contract address |
| `NEXT_PUBLIC_ARCIUM_REGISTRY` | ArciumRegistry contract address |
| `PAYROLL_SIGNER_PRIVATE_KEY` | Dedicated wallet for autonomous Saturday payroll |
| `CRON_SECRET` | Bearer token to secure the cron endpoint |

### Deploying Contracts

```bash
# Add DEPLOYER_PRIVATE_KEY to .env.local first
npx hardhat run scripts/deploy.js --network mainnet --config hardhat.config.js
npx hardhat run contracts/deploy-registry.js --network mainnet --config hardhat.config.js
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ZeroPay Frontend                    │
│          Next.js 14 · wagmi · WalletConnect             │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌─────────────┐
   │  Supabase   │ │  0G      │ │  Arcium     │
   │  Postgres   │ │  Storage │ │  Registry   │
   │  + Realtime │ │  Mainnet │ │  On-chain   │
   └─────────────┘ └──────────┘ └─────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  ZeroPayBatch   │
                │  0G Newton      │
                │  Mainnet        │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Vercel Cron    │
                │  Saturday 9AM   │
                │  Auto Payroll   │
                └─────────────────┘
```

---

## Hackathon

Built for the **0G APAC Hackathon** — demonstrating confidential compute, decentralized storage, and autonomous AI agents on 0G Newton Mainnet.

- Chain: 0G Newton Mainnet (Chain ID: 16661)
- Storage: 0G Mainnet Storage Layer
- Tags: #0GHackathon #BuildOn0G
