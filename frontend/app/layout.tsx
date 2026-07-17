import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: 'swap' });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: 'swap' });

export const metadata: Metadata = {
  title: "AI Resume Tailor",
  description: "Tailor your resume to any job description, ATS-safe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased text-ink-navy bg-parchment`}>
        {children}
      </body>
    </html>
  );
}
