import { x402Facilitator } from "@x402/core/facilitator";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "@x402/core/types";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import dotenv from "dotenv";
import express from "express";
import { createWalletClient, defineChain, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const PORT = process.env.PORT || "4022";

if (!process.env.EVM_PRIVATE_KEY) {
  console.error("EVM_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

// Define Flow EVM chain
const flowEvm = defineChain({
  id: 747,
  name: "Flow EVM",
  nativeCurrency: { name: "Flow", symbol: "FLOW", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.evm.nodes.onflow.org"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://evm.flow.com" },
  },
});

// Initialize account
const account = privateKeyToAccount(
  process.env.EVM_PRIVATE_KEY as `0x${string}`,
);
console.log(`Facilitator account: ${account.address}`);

// Create viem client for Flow EVM
const viemClient = createWalletClient({
  account,
  chain: flowEvm,
  transport: http("https://mainnet.evm.nodes.onflow.org"),
}).extend(publicActions);

// Build the FacilitatorEvmSigner
const evmSigner = toFacilitatorEvmSigner({
  address: account.address,
  getCode: (args: { address: `0x${string}` }) => viemClient.getCode(args),
  readContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => viemClient.readContract({ ...args, args: args.args || [] }),
  verifyTypedData: (args: {
    address: `0x${string}`;
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
    signature: `0x${string}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => viemClient.verifyTypedData(args as any),
  writeContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  }) => viemClient.writeContract({ ...args, args: args.args || [] }),
  sendTransaction: (args: { to: `0x${string}`; data: `0x${string}` }) =>
    viemClient.sendTransaction(args),
  waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
    viemClient.waitForTransactionReceipt(args),
});

// Initialize facilitator with lifecycle hooks
const facilitator = new x402Facilitator()
  .onBeforeVerify(async (ctx) => {
    console.log(`[verify] ${ctx.requirements.network} from ${ctx.paymentPayload.accepted?.payTo || "unknown"}`);
  })
  .onAfterVerify(async (ctx) => {
    console.log(`[verify] result: ${ctx.response?.isValid ? "valid" : "invalid"}`);
  })
  .onVerifyFailure(async (ctx) => {
    console.error(`[verify] failed:`, ctx.error);
  })
  .onAfterSettle(async (ctx) => {
    console.log(`[settle] tx: ${ctx.response?.transaction}`);
  })
  .onSettleFailure(async (ctx) => {
    console.error(`[settle] failed:`, ctx.error);
  });

// Register Flow EVM mainnet
facilitator.register(
  "eip155:747",
  new ExactEvmScheme(evmSigner),
);
console.log("Registered network: eip155:747 (Flow EVM)");

// Express app
const app = express();
app.use(express.json());

app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body as {
      paymentPayload: PaymentPayload;
      paymentRequirements: PaymentRequirements;
    };
    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
    }
    const response: VerifyResponse = await facilitator.verify(paymentPayload, paymentRequirements);
    res.json(response);
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
    }
    const response: SettleResponse = await facilitator.settle(
      paymentPayload as PaymentPayload,
      paymentRequirements as PaymentRequirements,
    );
    res.json(response);
  } catch (error) {
    console.error("Settle error:", error);
    if (error instanceof Error && error.message.includes("Settlement aborted:")) {
      return res.json({
        success: false,
        errorReason: error.message.replace("Settlement aborted: ", ""),
        network: req.body?.paymentPayload?.network || "unknown",
      } as SettleResponse);
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/supported", async (_req, res) => {
  try {
    res.json(facilitator.getSupported());
  } catch (error) {
    console.error("Supported error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: "eip155:747", chain: "Flow EVM" });
});

app.listen(parseInt(PORT), () => {
  console.log(`x402 Flow EVM Facilitator listening on http://localhost:${PORT}`);
  console.log(`  POST /verify   - Verify payment`);
  console.log(`  POST /settle   - Settle payment on-chain`);
  console.log(`  GET  /supported - List supported networks`);
  console.log(`  GET  /health    - Health check`);
});
