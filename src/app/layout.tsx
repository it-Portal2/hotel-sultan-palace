// app/layout.tsx

import type { Metadata } from "next";
import { Inter, Open_Sans, Quicksand, Poppins } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Sultan Palace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Moon+Dance&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body
        className={`
        ${inter.variable} 
        ${openSans.variable} 
        ${quicksand.variable} 
        ${poppins.variable}
        antialiased`}
      >
        <CartProvider> {children}</CartProvider>

        <WhatsAppButton />
      </body>
    </html>
  );
}
