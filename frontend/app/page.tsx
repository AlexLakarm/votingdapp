'use client';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  weight: ['700']
});

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="container mx-auto p-4">
      <Card className="max-w-md mx-auto mt-8 relative overflow-hidden min-h-[500px]">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/background.jpg"
            alt="Voting background"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 400px"
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/30 to-black/60" />
        </div>

        <CardHeader className="relative z-10">
          <CardTitle className={`${quicksand.className} text-white text-3xl font-bold drop-shadow-lg tracking-wide text-center`}>
            Welcome to the best Voting DApp on Earth
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 mt-auto">
          {isConnected ? (
            <div>
              <p className="text-sm text-gray-200 mb-8 drop-shadow text-center">
                Connected with: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <Link href="/voting" className="block">
                <Button 
                  className="w-full flex items-center justify-center gap-2 group bg-black/40 hover:bg-black/60 text-white border-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:scale-125" />
                  Launch App
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-200 drop-shadow text-center">
              Please connect your wallet to access the voting system.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}