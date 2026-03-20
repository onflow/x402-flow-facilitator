import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const facilitatorUrl =
  process.env.FACILITATOR_URL || "https://facilitator.flowindex.io";
export const payTo = process.env.PAY_TO_ADDRESS as `0x${string}`;

if (!payTo) {
  console.error("PAY_TO_ADDRESS environment variable is required");
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

export const server = new x402ResourceServer(facilitatorClient);
server.register("eip155:747", new ExactEvmScheme());
