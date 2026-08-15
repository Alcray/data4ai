import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CS324 Course Shell",
  description: "An empty course website shell based on the CS324 visual design.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
