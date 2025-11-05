// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";

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
        {/* Google Fonts - via link to avoid next/font turbopack issue */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Moon+Dance&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body
        className={"antialiased overflow-x-hidden max-w-full"}
      >
        {/* Tailwind keep animation classes */}
        <div className="hidden animate-slide-in-bottom animate-slide-in-left animate-slide-in-left-delay-200 animate-slide-in-left-delay-400" />
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>

        <WhatsAppButton />
      </body>
    </html>
  );
}
