"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ModeToggle } from "../ui/mode-toggle";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';

const Header = () => {

    const pathname = usePathname();

    // Afficher le bouton uniquement sur les pages de vote
    const showBackButton = pathname.startsWith('/voting');

    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {showBackButton && (
                    <Link href="/">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                )}
                <div className="flex items-center gap-4 ml-auto">
                    <ModeToggle />
                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            mounted,
                        }) => {
                            const ready = mounted;
                            const connected = ready && account && chain;

                            return (
                                <div
                                    {...(!ready && {
                                        'aria-hidden': true,
                                        style: {
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        },
                                    })}
                                >
                                    {(() => {
                                        if (!connected) {
                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    className="relative px-6 py-2 bg-white dark:bg-gray-800 rounded-lg
                                                    group overflow-hidden transition-all duration-300
                                                    hover:scale-105"
                                                >
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-blue-600 opacity-75 group-hover:opacity-100 transition-opacity duration-300"></span>
                                                    <span className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-lg"></span>
                                                    <span className="relative z-10 font-medium text-black dark:text-white transition-colors duration-300">
                                                        Connect Wallet
                                                    </span>
                                                </button>
                                            );
                                        }

                                        return (
                                            <div className="flex gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={openChainModal}
                                                >
                                                    {chain.name}
                                                </Button>

                                                <button
                                                    onClick={openAccountModal}
                                                    className="relative px-4 py-2 bg-white dark:bg-gray-800 rounded-lg
                                                    group overflow-hidden transition-all duration-300
                                                    hover:scale-105"
                                                >
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-blue-500 opacity-75 group-hover:opacity-100 transition-opacity duration-300"></span>
                                                    <span className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-lg"></span>
                                                    <span className="relative z-10 font-medium text-black dark:text-white transition-colors duration-300">
                                                        {account.displayName}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
            </div>
        </header>
    );
};

export default Header;