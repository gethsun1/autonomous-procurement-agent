import type { Metadata } from "next";
import "./globals.css";
import BackgroundMesh from "@/components/BackgroundMesh";

export const metadata: Metadata = {
  title: "Autonomous Procurement Agent | Cyber-Organic Noir",
  description:
    "AI-Powered autonomous procurement with privacy-preserving decisions and on-chain settlement using SKALE x402 and Google Gemini",
  keywords: [
    "blockchain",
    "AI",
    "procurement",
    "SKALE",
    "Gemini",
    "autonomous agents",
    "web3",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@300;400;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <BackgroundMesh />
        {children}
      </body>
    </html>
  );
}
