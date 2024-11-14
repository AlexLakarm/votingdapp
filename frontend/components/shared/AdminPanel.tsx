"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useWriteContract } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
}

interface AdminPanelProps {
    currentStatus?: number;
}

const AdminPanel = ({ currentStatus }: AdminPanelProps) => {
    const { toast } = useToast();
    const { writeContract } = useWriteContract({
        mutation: {
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: "Workflow status updated successfully",
                });
            },
            onError: (error) => {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    });

    const handleStartProposals = async () => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'startProposalsRegistering',
            });
        } catch (error) {
            console.error('Error starting proposals:', error);
        }
    };

    const handleEndProposals = async () => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'endProposalsRegistering',
            });
        } catch (error) {
            console.error('Error ending proposals:', error);
        }
    };

    const handleStartVoting = async () => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'startVotingSession',
            });
        } catch (error) {
            console.error('Error starting voting:', error);
        }
    };

    const handleEndVoting = async () => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'endVotingSession',
            });
        } catch (error) {
            console.error('Error ending voting:', error);
        }
    };

    const handleTallyVotes = async () => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'tallyVotes',
            });
        } catch (error) {
            console.error('Error tallying votes:', error);
        }
    };

    const handleWorkflowStatusChange = async (newStatus: number) => {
        try {
            await writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'startProposalsRegistering',
            });
        } catch (error) {
            console.error('Error changing workflow status:', error);
        }
    };

    const workflowButtons = [
        { 
            status: WorkflowStatus.RegisteringVoters, 
            label: "Register Voters", 
            href: "/voting/register",
        },
        { 
            status: WorkflowStatus.ProposalsRegistrationStarted, 
            label: "Start Proposals Registration", 
            href: "/voting/proposals",
            onClick: handleStartProposals
        },
        { 
            status: WorkflowStatus.ProposalsRegistrationEnded, 
            label: "End Proposals Registration", 
            href: "/voting/proposals",
            onClick: handleEndProposals
        },
        { 
            status: WorkflowStatus.VotingSessionStarted, 
            label: "Start Voting Session", 
            href: "/voting/vote",
            onClick: handleStartVoting
        },
        { 
            status: WorkflowStatus.VotingSessionEnded, 
            label: "End Voting Session", 
            href: "/voting/vote",
            onClick: handleEndVoting
        },
        { 
            status: WorkflowStatus.VotesTallied, 
            label: "Tally Votes", 
            href: "/voting/results",
            onClick: handleTallyVotes
        }
    ];

    return (
        <Card className="border-2 border-red-500">
            <CardHeader>
                <CardTitle className="text-center">Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="w-full group">
                                <Link 
                                    key={WorkflowStatus.RegisteringVoters} 
                                    href={workflowButtons[0].href} 
                                    className="block w-full transition-all duration-300 hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-background rounded-md"
                                >
                                    <Button
                                        className="w-full"
                                        variant={currentStatus === WorkflowStatus.RegisteringVoters ? "default" : "outline"}
                                        style={
                                            currentStatus === WorkflowStatus.RegisteringVoters 
                                                ? {
                                                    backgroundColor: '#2563eb',
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    fontWeight: '500',
                                                    boxShadow: '0 0 20px #2563eb',
                                                    border: 'none',
                                                    opacity: 1
                                                } 
                                                : undefined
                                        }
                                        onClick={(e) => {
                                            if (workflowButtons[0].onClick) {
                                                e.preventDefault();
                                                workflowButtons[0].onClick();
                                            }
                                        }}
                                        disabled={currentStatus !== WorkflowStatus.RegisteringVoters - 1}
                                    >
                                        {workflowButtons[0].label}
                                    </Button>
                                </Link>
                            </div>
                        </HoverCardTrigger>
                    </HoverCard>
                    {workflowButtons.slice(1).map((button) => (
                        <Link 
                            key={button.status} 
                            href={button.href} 
                            className="block w-full transition-all duration-300 hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-background rounded-md"
                        >
                            <Button
                                className="w-full"
                                variant={currentStatus === button.status ? "default" : "outline"}
                                style={
                                    currentStatus === button.status 
                                        ? {
                                            backgroundColor: '#2563eb',
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            fontWeight: '500',
                                            boxShadow: '0 0 20px #2563eb',
                                            border: 'none',
                                            opacity: 1
                                        } 
                                        : undefined
                                }
                                onClick={(e) => {
                                    if (button.onClick) {
                                        e.preventDefault();
                                        button.onClick();
                                    }
                                }}
                                disabled={currentStatus !== button.status - 1}
                            >
                                {button.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminPanel;