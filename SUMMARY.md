# x402 on Flow EVM — Status Update

## What is x402?

[x402](https://x402.org) is Coinbase's HTTP-native payment protocol. It enables pay-per-request APIs using HTTP 402 status codes. Clients sign USDC payments, servers verify via a facilitator, and settlement happens on-chain. Think Stripe for AI agents.

## What We Did Today

### 1. Deployed x402 Contracts on Flow EVM

- **x402ExactPermit2Proxy** deployed at canonical CREATE2 address: [`0x402085c248EeA27D92E8b30b2C58ed07f9E20001`](https://evm.flow.com/address/0x402085c248EeA27D92E8b30b2C58ed07f9E20001)
- Same address as Base, Optimism, and all other supported chains
- Verified on Blockscout

### 2. Built & Deployed a Flow EVM Facilitator

- **Repo**: https://github.com/onflow/x402-flow-facilitator
- **Live (temporary)**: https://facilitator.flowindex.io
- Supports x402 v2, exact payment scheme, Permit2 settlement
- Endpoints: `POST /verify`, `POST /settle`, `GET /supported`, `GET /health`

### 3. E2E Tested the Full Payment Flow

- Client signs payment → Server returns 402 → Client retries with signature → Facilitator verifies & settles on Flow EVM → Client gets data
- Successfully settled on-chain: [tx 0xeea1f8...](https://evm.flow.com/tx/0xeea1f8cb5924babd9f5d0cd73f9a308d66c35a3ffc248d4024ce7b219fec7669)

### 4. Created 7 Example Apps

All adapted from [official x402 examples](https://github.com/coinbase/x402/tree/main/examples/typescript) for Flow EVM:

| Example | Type | Framework |
|---------|------|-----------|
| `examples/server` | Resource server | Express |
| `examples/hono-server` | Resource server | Hono |
| `examples/mcp-server` | MCP server | MCP + Express |
| `examples/nextjs` | Full-stack | Next.js |
| `examples/client` | Client | fetch |
| `examples/axios-client` | Client | axios |
| `examples/mcp-client` | MCP client | MCP SDK |

### 5. Cadence Wrapper (COA Support)

- x402 **natively supports EIP-1271** — COA users can make x402 payments without special handling
- Created Cadence transactions: `setup_x402.cdc` (one-shot: create COA + fund FLOW + approve Permit2)
- Located in `cadence/transactions/`

### 6. Submitted PRs to coinbase/x402

See "PRs Waiting for Review" below.

---

## What Needs To Be Done (Action Required)

### 1. Deploy Facilitator on Official Infrastructure

The facilitator is currently running on Railway under a personal account at `facilitator.flowindex.io`. It needs to move to official Flow infrastructure.

**Code**: https://github.com/onflow/x402-flow-facilitator

**Steps:**
1. Generate a new EVM key pair for the facilitator wallet
2. Fund it with ~0.5 FLOW for gas (gas is extremely cheap on Flow EVM, ~16 Gwei)
3. Deploy the Node.js service (Railway, Fly.io, or any host)
4. Set env vars:
   ```
   EVM_PRIVATE_KEY=0x...   # New facilitator wallet private key
   PORT=8080
   ```
5. Point an official domain to it (e.g. `x402.flow.com` or `facilitator.flow.com`)
6. Verify it works: `curl https://<domain>/health`

**Current temporary wallet** (should be replaced):
- Address: `0x7C040af5d083d17B23249C2b286fEA4E625681F3`

### 2. Re-submit Ecosystem PR

Once the facilitator is on an official domain, update `baseUrl` in the ecosystem metadata and re-open the PR to coinbase/x402. Branch is ready at `onflow/x402:ecosystem/add-flow-evm-facilitator`.

### 3. Optional: UI Demo

The official x402 repo has a browser wallet example with full UI (wallet connect + payment flow). We can adapt it for Flow EVM and deploy to Vercel if needed for demos.

---

## PRs Waiting for Review (coinbase/x402)

| PR | Title | Status | What it does |
|----|-------|--------|--------------|
| [#1722](https://github.com/coinbase/x402/pull/1722) | `feat: add Flow EVM (eip155:747) as a supported network` | Open | Adds Flow EVM to the legacy x402 network config |
| [#1721](https://github.com/coinbase/x402/issues/1721) | `Add CDP facilitator support for Flow EVM (eip155:747)` | Open (Issue) | Requests Coinbase's hosted facilitator to support Flow EVM |

**Note**: Neither PR is blocking us. Our self-hosted facilitator works independently. These are for official ecosystem recognition.

---

## Flow EVM Chain Details

| Property | Value |
|----------|-------|
| Chain ID | `747` |
| CAIP-2 | `eip155:747` |
| RPC | `https://mainnet.evm.nodes.onflow.org` |
| Explorer | https://evm.flow.com |
| Gas | ~16 Gwei |

### Deployed Contracts

| Contract | Address |
|----------|---------|
| stgUSDC (Bridged USDC) | [`0xF1815bd50389c46847f0Bda824eC8da914045D14`](https://evm.flow.com/address/0xF1815bd50389c46847f0Bda824eC8da914045D14) |
| Permit2 | [`0x000000000022D473030F116dDEE9F6B43aC78BA3`](https://evm.flow.com/address/0x000000000022D473030F116dDEE9F6B43aC78BA3) |
| x402ExactPermit2Proxy | [`0x402085c248EeA27D92E8b30b2C58ed07f9E20001`](https://evm.flow.com/address/0x402085c248EeA27D92E8b30b2C58ed07f9E20001) |
