import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://farewell-krystyna.jumiknows.workers.dev"),
  title: "Au revoir, Krystyna — A farewell from your team",
  description: "A collection of notes, memories, and warm wishes for Krystyna’s next chapter in France.",
  applicationName: "Pour Krystyna",
  authors: [{ name: "Krystyna’s team" }],
  creator: "Krystyna’s team",
  keywords: ["Krystyna", "farewell", "France", "Paris", "team memories"],
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "/",
    siteName: "Pour Krystyna",
    title: "Au revoir, Krystyna",
    description: "A Parisian farewell from your teammates.",
    images: [{ url: "/farewell-share.png", width: 1200, height: 630, alt: "Au revoir, Krystyna — Ottawa to Paris" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Au revoir, Krystyna",
    description: "A Parisian farewell from your teammates.",
    images: ["/farewell-share.png"],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#a63e42",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body>{children}</body>
    </html>
  );
}
