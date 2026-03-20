import { config } from "dotenv";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

config();

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as `0x${string}`;
if (!evmPrivateKey) {
  console.error("EVM_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const url = `${baseURL}/weather`;

async function main(): Promise<void> {
  const evmSigner = privateKeyToAccount(evmPrivateKey);
  console.log(`Payer address: ${evmSigner.address}`);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(evmSigner));

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  console.log(`\nRequesting: ${url}`);
  console.log("This will automatically handle x402 payment on Flow EVM...\n");

  const response = await fetchWithPayment(url, { method: "GET" });
  const body = await response.json();
  console.log("Response:", JSON.stringify(body, null, 2));

  const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(
    (name) => response.headers.get(name),
  );
  if (paymentResponse) {
    console.log("\nPayment settled:");
    console.log(`  Transaction: ${paymentResponse.transaction}`);
    console.log(`  Network: ${paymentResponse.network}`);
  }
}

main().catch((error) => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});
