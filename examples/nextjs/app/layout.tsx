export const metadata = {
  title: "x402 on Flow EVM",
  description: "Pay-per-request API demo powered by x402 on Flow EVM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
