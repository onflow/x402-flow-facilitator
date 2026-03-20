import { config } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import express from "express";
import { z } from "zod";

config();

const payTo = process.env.PAY_TO_ADDRESS as `0x${string}`;
if (!payTo) {
  console.error("PAY_TO_ADDRESS environment variable is required");
  process.exit(1);
}

const facilitatorUrl =
  process.env.FACILITATOR_URL || "https://facilitator.flowindex.io";
const port = parseInt(process.env.PORT || "4022", 10);

function getWeatherData(city: string) {
  const conditions = ["sunny", "cloudy", "rainy", "snowy", "windy"];
  const weather = conditions[Math.floor(Math.random() * conditions.length)];
  const temperature = Math.floor(Math.random() * 40) + 40;
  return { city, weather, temperature, chain: "Flow EVM" };
}

async function main(): Promise<void> {
  const mcpServer = new McpServer({
    name: "x402 Flow EVM Weather Service",
    version: "1.0.0",
  });

  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register("eip155:747", new ExactEvmScheme());
  await resourceServer.initialize();

  const weatherAccepts = await resourceServer.buildPaymentRequirements({
    scheme: "exact",
    network: "eip155:747",
    payTo,
    price: "$0.001",
    asset: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
    extra: { name: "stgUSDC", version: "2" },
  });

  const paidWeather = createPaymentWrapper(resourceServer, {
    accepts: weatherAccepts,
  });

  // Paid tool
  mcpServer.tool(
    "get_weather",
    "Get current weather for a city. Requires $0.001 payment in stgUSDC on Flow EVM.",
    { city: z.string().describe("The city name to get weather for") },
    paidWeather(async (args: { city: string }) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(getWeatherData(args.city), null, 2),
        },
      ],
    })),
  );

  // Free tool
  mcpServer.tool("ping", "A free health check tool", {}, async () => ({
    content: [{ type: "text" as const, text: "pong from Flow EVM" }],
  }));

  // Start Express SSE server
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = crypto.randomUUID();
    transports.set(sessionId, transport);
    res.on("close", () => transports.delete(sessionId));
    await mcpServer.connect(transport);
  });

  app.post("/messages", express.json(), async (req, res) => {
    const transport = Array.from(transports.values())[0];
    if (!transport) {
      res.status(400).json({ error: "No active SSE connection" });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  app.get("/health", (_, res) => {
    res.json({
      status: "ok",
      chain: "Flow EVM",
      tools: ["get_weather (paid: $0.001)", "ping (free)"],
    });
  });

  app.listen(port, () => {
    console.log(`x402 MCP Server on Flow EVM`);
    console.log(`  Tools: get_weather ($0.001), ping (free)`);
    console.log(`  SSE: http://localhost:${port}/sse`);
    console.log(`  Facilitator: ${facilitatorUrl}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
