import Link from "next/link";

export default function Home() {
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", fontFamily: "monospace" }}>
      <h1>x402 on Flow EVM</h1>
      <p>Pay-per-request API demo. Each call costs $0.001 in stgUSDC on Flow EVM.</p>
      <ul>
        <li>
          <Link href="/api/weather">GET /api/weather</Link> — paid endpoint ($0.001)
        </li>
      </ul>
      <h2>How it works</h2>
      <ol>
        <li>Client requests /api/weather</li>
        <li>Server returns 402 with payment requirements</li>
        <li>Client signs payment and retries</li>
        <li>Facilitator verifies and settles on Flow EVM</li>
        <li>Client receives weather data</li>
      </ol>
      <p>
        <a href="https://github.com/onflow/x402-flow-facilitator">GitHub</a>
        {" | "}
        <a href="https://x402.org">x402 Protocol</a>
        {" | "}
        <a href="https://flow.com">Flow</a>
      </p>
    </div>
  );
}
