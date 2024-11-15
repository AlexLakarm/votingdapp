"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent, usePublicClient } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import { useTransactionToast } from "@/hooks/use-transaction-toast";

interface Proposal {
    description: string;
    voteCount: bigint;
}

const ProposalsPage = () => {
    const { address} = useAccount();

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();

    const { data: voterData } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getVoter',
        args: [address as `0x${string}`],
    });

    const { writeContract, data: hash, error } = useWriteContract();

    // Utilisation du hook useTransactionToast
    const { isSuccess } = useTransactionToast(hash, error);

    // Récupérer les propositions
    const fetchProposals = useCallback(async () => {
        if (!publicClient || !voterData?.isRegistered) return;
        
        try {
            const proposalCount = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'getProposalsCount',
            }) as bigint;

            const proposals = [];
            for (let i = 0; i < Number(proposalCount); i++) {
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
    }, [publicClient, voterData?.isRegistered]);

    // Charger les propositions au démarrage et après une transaction réussie
    useEffect(() => {
        fetchProposals();
    }, [publicClient, voterData, isSuccess, fetchProposals]);

    // Écouter les nouveaux événements de proposition
    useWatchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'ProposalRegistered',
        onLogs() {
            fetchProposals();
        },
    });

    const handleProposalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const description = formData.get('description') as string;

        if (!description) return;

        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'addProposal',
                args: [description],
            });

            // Reset form
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            console.error('Error adding proposal:', error);
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
                <p>{voterData?.isRegistered ? 'You are a registered voter, welcome to the proposals page !' : 'Sorry you are not a registered voter you can not add proposals'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {voterData?.isRegistered && (
                    <Card className="border-2 border-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Add Proposal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProposalSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        name="description"
                                        placeholder="Enter your proposal description"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Submit Proposal
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
                                                <span className="text-sm text-muted-foreground">
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

export default ProposalsPage;