// app/layout.tsx

import type { Metadata } from "next";
import { 
  Inter, 
  Open_Sans, 
  Quicksand, 
  Jomolhari, 
  Kaisei_Decol, 
  Oooh_Baby, 
  Poppins, 
  Shadows_Into_Light_Two 
} from "next/font/google";
import "./globals.css";
import WhatsAppButton from '@/components/WhatsAppButton';

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const openSans = Open_Sans({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800"], 
  variable: "--font-open-sans" 
});

const quicksand = Quicksand({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"], 
  variable: "--font-quicksand" 
});

const jomolhari = Jomolhari({ 
  subsets: ["latin"], 
  weight: "400", 
  variable: "--font-jomolhari" 
});

const kaisei = Kaisei_Decol({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"], 
  variable: "--font-kaisei" 
});

const ooohBaby = Oooh_Baby({ 
  subsets: ["latin"], 
  weight: "400", 
  variable: "--font-oooh-baby" 
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
});

const script = Shadows_Into_Light_Two({ 
  subsets: ["latin"], 
  weight: "400",
  variable: "--font-script" 
});

export const metadata: Metadata = { 
  title: "The Sultan Palace" 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`
        ${inter.variable} 
        ${openSans.variable} 
        ${quicksand.variable} 
        ${jomolhari.variable} 
        ${kaisei.variable} 
        ${ooohBaby.variable} 
        ${poppins.variable}
        ${script.variable} 
        antialiased`
      }>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}