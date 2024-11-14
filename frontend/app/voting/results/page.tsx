"use client";
import { useReadContract } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import { PartyPopper } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ResultsPage = () => {
    const { data: winningProposalId } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'winningProposalID',
    });

    const { data: winningProposal } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getOneProposal',
        args: [winningProposalId ? BigInt(winningProposalId.toString()) : 0n],
    });

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
            <h1 className="text-2xl font-bold mb-6">Results</h1>
            <Card className="bg-gradient-to-r from-blue-800 to-fuchsia-00 text-white shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-2xl font-bold">Winning Proposal</CardTitle>
                        <p className="text-sm mt-1 opacity-90">
                            with {winningProposal?.voteCount?.toString() || '0'} votes
                        </p>
                    </div>
                    <PartyPopper className="h-12 w-12 animate-bounce" />
                </CardHeader>
                <CardContent>
                    <div className="mt-4">
                        <p className="text-3xl font-bold mb-2">
                            Proposal #{winningProposalId?.toString() || '...'}
                        </p>
                        <p className="text-lg opacity-90">
                            {winningProposal?.description || 'Chargement de la description...'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResultsPage;