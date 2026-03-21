import { config } from "dotenv";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

config();

const payTo = process.env.PAY_TO_ADDRESS as `0x${string}`;
if (!payTo) {
  console.error("PAY_TO_ADDRESS environment variable is required");
  process.exit(1);
}

const facilitatorUrl =
  process.env.FACILITATOR_URL || "https://facilitator.flowindex.io";

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const app = new Hono();

app.use(
  paymentMiddleware(
    {
      "GET /weather": {
        accepts: {
          scheme: "exact",
          network: "eip155:747",
          price: {
            amount: "1000",
            asset: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
            extra: {
              name: "Bridged USDC (Stargate)",
              version: "2",
            },
          },
          payTo,
        },
        description: "Weather data on Flow EVM",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      "eip155:747",
      new ExactEvmScheme(),
    ),
  ),
);

app.get("/weather", (c) => {
  return c.json({
    report: {
      city: "San Francisco",
      weather: "sunny",
      temperature: 72,
      chain: "Flow EVM",
    },
  });
});

const PORT = parseInt(process.env.PORT || "4021");
serve({ fetch: app.fetch, port: PORT });
console.log(`x402 Hono Server on Flow EVM`);
console.log(`  GET /weather - $0.001 per request`);
console.log(`  Facilitator: ${facilitatorUrl}`);
console.log(`  Listening on http://localhost:${PORT}`);
