import { config } from "dotenv";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { createx402MCPClient } from "@x402/mcp";
import { privateKeyToAccount } from "viem/accounts";

config();

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as `0x${string}`;
if (!evmPrivateKey) {
  console.error("EVM_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

const serverUrl = process.env.MCP_SERVER_URL || "http://localhost:4022";

async function main(): Promise<void> {
  console.log("x402 MCP Client on Flow EVM\n");

  const evmSigner = privateKeyToAccount(evmPrivateKey);
  console.log(`Payer: ${evmSigner.address}`);
  console.log(`Server: ${serverUrl}\n`);

  // Create x402-enabled MCP client
  const client = createx402MCPClient({
    name: "x402-flow-mcp-client",
    version: "1.0.0",
    schemes: [
      { network: "eip155:*", client: new ExactEvmScheme(evmSigner) },
    ],
  });

  const transport = new SSEClientTransport(new URL(`${serverUrl}/sse`));
  await client.connect(transport);

  // List available tools
  const { tools } = await client.listTools();
  console.log("Available tools:");
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.description}`);
  }

  // Call free tool
  console.log("\nCalling ping (free)...");
  const pingResult = await client.callTool("ping");
  console.log("Result:", JSON.stringify(pingResult.content, null, 2));

  // Call paid tool
  console.log("\nCalling get_weather (paid, $0.001 in stgUSDC)...");
  const weatherResult = await client.callTool("get_weather", { city: "San Francisco" });
  console.log("Result:", JSON.stringify(weatherResult.content, null, 2));

  await client.close();
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
