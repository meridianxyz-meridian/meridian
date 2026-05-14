# Meridian

> Patient-sovereign AI health intelligence. Your records on Walrus. Your AI advocate on Sui. Your earnings from your data.

## Architecture

```
meridian/
├── contracts/          # Sui Move smart contracts
│   └── meridian_contracts/
│       └── sources/
│           ├── health_record.move   # Patient-owned record objects + consent grants
│           └── marketplace.move     # Data marketplace with 15% platform fee
├── backend/            # Node.js AI agent server
│   └── src/
│       ├── agents/healthAgent.ts    # Claude-powered health advocate
│       ├── services/
│       │   ├── walrus.ts            # Walrus blob storage
│       │   ├── seal.ts              # Seal encryption
│       │   └── fhirParser.ts        # FHIR R4 bundle parsing
│       └── routes/
│           ├── records.ts           # Upload + retrieve records
│           ├── agent.ts             # AI synthesis + chat
│           └── marketplace.ts       # Data listings
└── frontend/           # React + Vite patient portal
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx        # Health overview + urgent flags
        │   ├── UploadRecords.tsx    # Drag-drop upload to Walrus
        │   ├── Timeline.tsx         # AI-synthesized health timeline
        │   ├── ShareAccess.tsx      # QR consent grant generation
        │   ├── Marketplace.tsx      # Clinical trial enrollment + earnings
        │   └── AgentChat.tsx        # Streaming AI health advocate chat
        └── data/demoData.ts         # Zarah's 12-year synthetic demo data
```

## Quick Start

### 1. Deploy Move contracts

```bash
cd contracts/meridian_contracts
sui client publish --gas-budget 100000000
```

### 2. Start backend

```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY
npm install
npm run dev
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Key Design Decisions

### Why Sui's owned object model?
Each `HealthRecord` is a Sui owned object — it lives at the patient's address, not in a shared pool. No hospital or contract can access it without the patient's signature.

### Why Walrus + Seal?
Medical records can be 50MB+ (imaging). Walrus provides content-addressed, decentralized storage. Seal provides threshold encryption — the decryption key is split such that no single party (including Meridian) can decrypt without the patient's consent.

### Why PTBs for consent?
A single Programmable Transaction Block atomically: creates the ConsentGrant, transfers it to the doctor, and emits the event. The doctor gets access in one transaction. When the grant expires, the Seal key becomes invalid — no on-chain action needed.

### AI Agent (Claude claude-sonnet-4-20250514)
- Synthesizes scattered records into a clean timeline
- Detects medication interactions (critical: Ibuprofen + Lisinopril + CKD)
- Matches patient to clinical trials
- Streams conversational responses for the health advocate chat

## Demo Script

Zarah has 12 years of records across 6 hospitals. She's moving to a new city.

1. **Upload** — drag 5 years of PDFs. Encrypted + on Walrus in 60 seconds.
2. **Timeline** — AI synthesizes her health story. Flags 3 drug interactions she never knew about.
3. **Share** — new doctor scans QR code. Full record access. Expires in 2 hours automatically.
4. **Marketplace** — 2 clinical trials matched. $800 in potential earnings. One click to enroll.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | Sui (owned objects, PTBs, zkLogin) |
| Storage | Walrus (encrypted medical blobs) |
| Encryption | Seal (threshold encryption) |
| AI | Claude claude-sonnet-4-20250514 (Anthropic) |
| Frontend | React + Vite + Tailwind |
| Auth | zkLogin (Google/Apple — zero wallet knowledge) |
| Marketplace | DeepBook (data research token market) |
| Interop | FHIR R4 parsing |
