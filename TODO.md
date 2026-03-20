# x402 on Flow EVM — Next Steps

## Current Status

- [x] x402ExactPermit2Proxy deployed at canonical address `0x402085c248EeA27D92E8b30b2C58ed07f9E20001`
- [x] Self-hosted facilitator running on Railway (`https://facilitator.flowindex.io`)
- [x] GitHub repo: https://github.com/onflow/x402-flow-facilitator
- [x] Examples: Express, Hono, Next.js, MCP server/client, fetch, axios
- [x] Cadence wrapper: `setup_x402.cdc` (create COA + fund + approve Permit2)
- [x] EIP-1271 / COA support: **confirmed working** — x402 natively supports EIP-1271/EIP-6492
- [x] Issue #1721: CDP facilitator support request (open)
- [x] PR #1722: legacy network config (open)

## Action Items

### 1. Move Facilitator to Official Domain

The facilitator is currently hosted at `facilitator.flowindex.io` on Railway under a personal account. It needs to be moved to an official Flow domain (e.g. `x402.flow.com` or `facilitator.flow.com`).

**What's needed:**
- A dedicated key pair for the facilitator wallet (the private key signs settlement transactions on Flow EVM)
- The facilitator wallet needs FLOW for gas (~0.5 FLOW is plenty, gas is ~16 Gwei)
- Host on official infra (Railway, Fly.io, or any Node.js host)
- Point official domain to the deployment

**Current facilitator wallet (temporary):**
- Address: `0x7C040af5d083d17B23249C2b286fEA4E625681F3`
- Should be replaced with an officially managed key pair

**Env vars required:**
```
EVM_PRIVATE_KEY=0x...   # Facilitator wallet private key
PORT=8080               # Server port
```

### 2. Re-submit Ecosystem PR to coinbase/x402

Once the facilitator is on the official domain, submit a PR to add Flow EVM to the x402 ecosystem directory.

**File:** `typescript/site/app/ecosystem/partners-data/flow-evm-facilitator/metadata.json`

```json
{
  "name": "Flow EVM x402 Facilitator",
  "description": "x402 facilitator for Flow EVM. Fee-free USDC settlement on Flow's EVM-equivalent chain with extremely low gas costs.",
  "logoUrl": "/logos/flow-evm-facilitator.png",
  "websiteUrl": "https://flow.com",
  "category": "Facilitators",
  "facilitator": {
    "baseUrl": "https://<official-domain>",
    "networks": ["flow-evm"],
    "schemes": ["exact"],
    "assets": ["EIP-3009"],
    "supports": {
      "verify": true,
      "settle": true,
      "supported": true,
      "list": false
    }
  }
}
```

Branch is ready at `onflow/x402:ecosystem/add-flow-evm-facilitator`, just need to update `baseUrl` and re-open PR.

### 3. Remaining Items

| Task | Status | Owner |
|------|--------|-------|
| Move facilitator to official domain + key pair | Pending | Flow team |
| Re-submit ecosystem PR | Blocked on #1 | onflow |
| USDC liquidity (Circle BD) | Pending | BD |
| CDP facilitator support (Issue #1721) | Waiting on Coinbase | — |
| E2E test | Pending | Dev |
