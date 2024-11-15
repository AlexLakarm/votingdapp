"use client";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAccount, useReadContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import { parseAbiItem } from 'viem';
import AdminPanel from '@/components/shared/AdminPanel';
import WorkflowStatusDisplay from '@/components/shared/WorkflowStatusDisplay';
import StatusCard from '@/components/shared/StatusCard';
import { useEffect, useState} from 'react';

const VotingApp = () => {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [registeredVotersCount, setRegisteredVotersCount] = useState(0);
    const [proposalsCount, setProposalsCount] = useState<number>(0);

    const [userVoteInfo, setUserVoteInfo] = useState<{ hasVoted: boolean, votedProposalId: number | null }>({
        hasVoted: false,
        votedProposalId: null
    });
    const [workflowStatus, setWorkflowStatus] = useState<number>();
    
    const { data: ownerAddress } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'owner',
    });

    const { data: currentStatus } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'workflowStatus',
    });

    // Lecture du nombre total de propositions
    const { data: totalProposals } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getProposalsCount',
    });

    // Mise à jour du nombre de propositions (moins la proposition GENESIS)
    useEffect(() => {
        if (totalProposals) {
            setProposalsCount(Number(totalProposals) - 1);
        }
    }, [totalProposals]);

    console.log('Connected address:', address);
    console.log('Owner address:', ownerAddress);
    console.log('Contract address:', contractAddress);

    const isOwner = Boolean(
        address && 
        ownerAddress && 
        address.toLowerCase() === ownerAddress.toLowerCase()
    );

    console.log('Is owner:', isOwner);

    // Récupérer le nombre de votants enregistrés
    useEffect(() => {
        const fetchVotersCount = async () => {
            if (!publicClient) return;
            
            try {
                // Récupérer le bloc actuel
                const currentBlock = await publicClient.getBlockNumber();
                // Calculer le bloc de départ (par exemple, 1000 blocs en arrière)
                const fromBlock = currentBlock - BigInt(1000) > 0n ? currentBlock - BigInt(1000) : 0n;

                const logs = await publicClient.getLogs({
                    address: contractAddress,
                    event: parseAbiItem('event VoterRegistered(address voterAddress)'),
                    fromBlock: fromBlock,
                    toBlock: 'latest'
                });

                setRegisteredVotersCount(logs.length);
            } catch (error) {
                console.error('Error fetching voters count:', error);
                // En cas d'erreur, on met une valeur par défaut
                setRegisteredVotersCount(0);
            }
        };

        fetchVotersCount();
    }, [publicClient]);

    // Mise à jour du state local quand currentStatus change
    useEffect(() => {
        if (currentStatus !== undefined) {
            setWorkflowStatus(Number(currentStatus));
        }
    }, [currentStatus]);

    const { data: voterData } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getVoter',
        args: [address as `0x${string}`],
    });

    useEffect(() => {
        if (voterData) {
            console.log('Voter data:', voterData);
            setUserVoteInfo({
                hasVoted: voterData.hasVoted,
                votedProposalId: voterData.hasVoted ? Number(voterData.votedProposalId) : null
            });
        }
    }, [voterData]);

    // Écouter uniquement les changements de statut
    useWatchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'WorkflowStatusChange',
        onLogs(logs) {
            const [event] = logs;
            const newStatus = Number(event.args.newStatus);
            console.log('Workflow status changed to:', newStatus);
            setWorkflowStatus(newStatus);
        },
    });

    // Lecture du gagnant
    const { data: winningProposalId } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'winningProposalID',
    });

    // Lecture de la proposition gagnante
    const { data: winningProposal } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getOneProposal',
        args: [winningProposalId ? BigInt(winningProposalId.toString()) : 0n],
    });

    const statusCards = [
        {
            number: "1/",
            title: "Registering Voters",
            stats: [
                { label: "Total Registered", value: `${registeredVotersCount} voters` },
                { 
                    label: "Registration Status", 
                    value: Number(currentStatus) === 0 ? "Open" : "Closed" 
                }
            ],
            buttonText: "See Registered Voters",
            href: "/voting/register",
            workflowStatus: 0
        },
        {
            number: "2/",
            title: "Proposals",
            stats: [
                { label: "Total Proposals", value: `${proposalsCount} proposals` },
                { label: "Your Proposals", value: `${voterData?.nbProposals || 0} proposals` }
            ],
            buttonText: "To Proposals Page",
            href: "/voting/proposals",
            workflowStatus: 1
        },
        {
            number: "3/",
            title: "Votes",
            stats: [
                { 
                    label: "Has Voted", 
                    value: userVoteInfo.hasVoted ? "Yes" : "No" 
                },
                { 
                    label: "Your Vote", 
                    value: userVoteInfo.hasVoted && userVoteInfo.votedProposalId !== null
                        ? `Proposal #${userVoteInfo.votedProposalId}` 
                        : "Not voted" 
                }
            ],
            buttonText: "Vote Now",
            href: "/voting/vote",
            workflowStatus: 3
        },
        {
            number: "4/",
            title: "Results",
            stats: [
                { 
                    label: "Winner", 
                    value: Number(currentStatus) === 5 
                        ? `Proposal #${winningProposalId?.toString()}` 
                        : "Pending" 
                },
                { 
                    label: "Winning Votes", 
                    value: Number(currentStatus) === 5 
                        ? `${winningProposal?.voteCount.toString() || '0'} votes` 
                        : "-- votes" 
                }
            ],
            buttonText: "See Results",
            href: "/voting/results",
            workflowStatus: 5
        }
    ];

    if (!isConnected) {
        return (
            <div className="container mx-auto p-4">
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Hey there !</AlertTitle>
                    <AlertDescription>
                        You need to connect your wallet to access the voting system. Please return to the homepage and connect your wallet.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 text-sm">
                                <p>{isOwner ? 'You are the owner of the contract, you can access the admin panel.' : ''}</p>
            </div>

            <WorkflowStatusDisplay currentStatus={workflowStatus} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {isOwner && <AdminPanel currentStatus={workflowStatus} />}
                {statusCards.map((card, index) => (
                    <StatusCard 
                        key={index} 
                        {...card} 
                        currentStatus={workflowStatus}
                    />
                ))}
            </div>
        </div>
    );
};

export default VotingApp;