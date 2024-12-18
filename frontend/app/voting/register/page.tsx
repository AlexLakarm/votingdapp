"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserPlus, Users, Loader2} from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent, usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { contractAddress, contractABI } from '@/config/contract';
import { useToast } from "@/hooks/use-toast";
import { useTransactionToast } from "@/hooks/use-transaction-toast";

const RegisterPage = () => {
    const { address, isConnected } = useAccount();
    const { data: ownerAddress } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'owner',
    });
    const { writeContract, data: hash, error } = useWriteContract();
    const { toast } = useToast();
    const publicClient = usePublicClient();
    const [registeredVoters, setRegisteredVoters] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Utilisation du hook useTransactionToast
    const { isSuccess } = useTransactionToast(hash, error);

    const isOwner = Boolean(
        address && 
        ownerAddress && 
        address.toLowerCase() === ownerAddress.toLowerCase()
    );

    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const voterAddress = formData.get('address') as string;

        if (!voterAddress) return;

        if (!voterAddress.startsWith('0x')) {
            toast({
                title: "Invalid Address",
                description: "Address must start with '0x'",
                variant: "destructive",
            });
            return;
        }

        console.log('Attempting to register voter:', voterAddress);
        
        try {
            writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'addVoter',
                args: [voterAddress as `0x${string}`],
            });
            console.log('WriteContract called successfully');
        } catch (error) {
            console.error('Error in handleRegister:', error);
        }
    };

    // Récupérer les événements passés au chargement
    useEffect(() => {
        const fetchPastEvents = async () => {
            if (!publicClient) return;
            
            try {
                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;

                const logs = await publicClient.getLogs({
                    address: contractAddress,
                    event: parseAbiItem('event VoterRegistered(address voterAddress)'),
                    fromBlock,
                    toBlock: currentBlock
                });

                const uniqueAddresses = new Set(
                    logs
                        .map(log => log.args.voterAddress)
                        .filter((address): address is `0x${string}` => address !== undefined)
                );
                
                setRegisteredVoters(Array.from(uniqueAddresses) as string[]);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching past events:', error);
                setIsLoading(false);
            }
        };

        fetchPastEvents();
    }, [publicClient, isSuccess]);

    // Écouter les nouveaux événements
    useWatchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'VoterRegistered',
        onLogs(logs) {
            const newVoters = logs.map(log => log.args.voterAddress as string);
            setRegisteredVoters(prev => [...new Set([...prev, ...newVoters])]);
        },
    });

    if (!isConnected) {
        return (
            <div className="container mx-auto p-4">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        Please connect your wallet to access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <Link href="/voting">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Voting
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isOwner && (
                    <Card className="border-2 border-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                Register Voter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        name="address"
                                        placeholder="Voter address (0x...)"
                                        required
                                        pattern="^0x[a-fA-F0-9]{40}$"
                                        title="Please enter a valid Ethereum address"
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Register Voter
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border border-input">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Registered Voters ({registeredVoters.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {registeredVoters.length > 0 ? (
                                    registeredVoters.map((voter, index) => (
                                        <div 
                                            key={index} 
                                            className="p-2 bg-muted rounded-lg flex items-center justify-between"
                                        >
                                            <span className="font-mono text-sm">
                                                {voter.slice(0, 6)}...{voter.slice(-4)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No voters registered yet
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RegisterPage;