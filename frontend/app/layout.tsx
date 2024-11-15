"use client";
import CustomRainbowKitProvider from "./customRainbowKit";
import { Inter, Quicksand, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ["latin"] });
const quicksand = Quicksand({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700']
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${poppins.variable} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomRainbowKitProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </CustomRainbowKitProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}