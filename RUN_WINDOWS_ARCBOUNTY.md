# ArcBounty v4 — Windows run guide

## 1) Install frontend packages

```powershell
cd D:\ARC\arcbounty-final\frontend
npm install
```

If Circle App Kit packages were not installed yet:

```powershell
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem
```

## 2) Add frontend environment

Create:

```txt
frontend\.env.local
```

Add:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ARCBOUNTY_CONTRACT
NEXT_PUBLIC_CIRCLE_KIT_KEY=KIT_KEY:your_id:your_secret
NEXT_PUBLIC_CIRCLE_PROXY_URL=
```

`NEXT_PUBLIC_CIRCLE_KIT_KEY` is required for Circle App Kit Swap. Bridge/Send may work without it depending on current SDK flow, but keep the key for full App Kit features.

## 3) Run frontend

```powershell
cd D:\ARC\arcbounty-final\frontend
npm run dev
```

Open:

```txt
http://localhost:3000
```

## 4) Deploy updated contract for reviews + leaderboard

The new `ArcBounty.sol` includes two-way 5-star reviews and leaderboard stats. Redeploy it and update the new contract address in `frontend\.env.local`.

```powershell
cd D:\ARC\arcbounty-final
npm install
npm run compile
npm run deploy:arc
```

After deploy, copy the new contract address:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xNEW_CONTRACT_ADDRESS
```

Then restart frontend:

```powershell
cd D:\ARC\arcbounty-final\frontend
npm run dev
```

## Pages added

- `/faucet` — Circle official faucet flow
- `/pay` and `/pay/link` — Payment Link using Circle App Kit Send, with ERC-20 fallback
- `/swap` — Circle App Kit Swap on Arc Testnet
- `/bridge` — Circle App Kit Bridge
- `/leaderboard` — on-chain rating/reputation leaderboard
- Bounty detail page — client/freelancer 5-star review after job approval
- Profile dropdown — Discord, X, wallet, balance, theme toggle
