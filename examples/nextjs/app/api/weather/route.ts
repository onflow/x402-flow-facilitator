import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { server, payTo } from "../../../x402";

const handler = async (_: NextRequest) => {
  return NextResponse.json({
    report: {
      city: "San Francisco",
      weather: "sunny",
      temperature: 72,
      chain: "Flow EVM",
    },
  });
};

export const GET = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$0.001",
        network: "eip155:747",
        payTo,
        asset: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
        extra: {
          name: "Bridged USDC (Stargate)",
          version: "2",
        },
      },
    ],
    description: "Weather data on Flow EVM",
    mimeType: "application/json",
  },
  server,
);
