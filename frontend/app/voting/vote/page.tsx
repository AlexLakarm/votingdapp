"use client";
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Send, AlertTriangle, Loader2, Copy, Check } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWatchContractEvent } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import { useToast } from "@/hooks/use-toast";
import { useTransactionToast } from "@/hooks/use-transaction-toast";

interface Proposal {
    description: string;
    voteCount: bigint;
}

const VotePage = () => {
    const { address, isConnected } = useAccount();
    const { toast } = useToast();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();
    const [hasCopied, setHasCopied] = useState(false);

    const { writeContract, data: hash, error } = useWriteContract();
    const { isSuccess } = useTransactionToast(hash, error);

    // Lecture du statut voter
    const { data: voterData } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getVoter',
        args: [address as `0x${string}`],
    });

    // Lecture du nombre total de propositions
    const { data: proposalsCount } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getProposalsCount',
    });

    // Écouter les nouveaux événements de vote
    useWatchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'Voted',
        onLogs() {
            fetchProposals(); // Recharger les propositions pour mettre à jour les compteurs de votes
        },
    });

    // Récupérer les propositions
    const fetchProposals = async () => {
        if (!proposalsCount || !voterData?.isRegistered || !publicClient) return;
        
        try {
            const proposals = [];
            for (let i = 0; i < Number(proposalsCount); i++) {
                const proposal = await publicClient.readContract({
                    address: contractAddress,
                    abi: contractABI,
                    functionName: 'getOneProposal',
                    args: [BigInt(i)],
                }) as Proposal;
                proposals.push(proposal);
            }
            setProposals(proposals);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching proposals:', error);
            setIsLoading(false);
        }
    };

    // Charger les propositions au démarrage et après une transaction réussie
    useEffect(() => {
        fetchProposals();
    }, [publicClient, voterData, isSuccess]);

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleVote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const proposalId = formData.get('proposalId') as string;

        if (!proposalId) return;

        // Vérifier que l'ID n'est pas 0 (GENESIS)
        if (proposalId === "0") {
            toast({
                title: "Invalid Proposal",
                description: "You cannot vote for the GENESIS proposal",
                variant: "destructive",
            });
            return;
        }

        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'setVote',
                args: [BigInt(proposalId)],
            });

            // Reset form
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            console.error('Error adding vote:', error);
            toast({
                title: "Error",
                description: "Failed to add vote. Please try again.",
                variant: "destructive",
            });
        }
    };

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

            {/* Debug info */}
            <div className="mb-4 text-sm">
                <p>{voterData?.isRegistered ? 'You are a registered voter, welcome to the voting page !' : 'Sorry you are not a registered voter you can not vote'}</p>
            </div>

            {/* Alerte si l'utilisateur a déjà voté */}
            {voterData?.hasVoted && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Already Voted</AlertTitle>
                    <AlertDescription>
                        You have already voted for Proposal #{voterData.votedProposalId.toString()}. You cannot vote again.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {voterData?.isRegistered && !voterData?.hasVoted && (
                    <Card className="border-2 border-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Vote
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleVote} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        name="proposalId"
                                        placeholder="Enter proposal ID (1 or higher)"
                                        required
                                        type="number"
                                        min="1"
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (value === 0) {
                                                e.target.value = "1";
                                            }
                                        }}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Add Vote
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border border-input">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Proposals ({proposals.length > 0 ? proposals.length - 1 : 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {proposals
                                    .filter((_, index) => index !== 0)
                                    .map((proposal, index) => (
                                        <div 
                                            key={index + 1}
                                            className="p-2 bg-muted rounded-lg"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">#{index + 1}</span>
                                                <span className={`text-sm ${Number(proposal.voteCount) > 0 ? 'text-green-400 font-medium' : 'text-muted-foreground'}`}>
                                                    {proposal.voteCount.toString()} votes
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm">
                                                {proposal.description}
                                            </p>
                                        </div>
                                    ))}
                                {proposals.length <= 1 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No proposals yet
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

export default VotePage;