"use client";
import { useReadContract } from 'wagmi';
import { contractAddress, contractABI } from '@/config/contract';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
}

interface WorkflowStatusDisplayProps {
    currentStatus?: number;
}

const getStatusText = (status: number) => {
    switch (status) {
        case WorkflowStatus.RegisteringVoters:
            return "Registering Voters";
        case WorkflowStatus.ProposalsRegistrationStarted:
            return "Proposals Registration Started";
        case WorkflowStatus.ProposalsRegistrationEnded:
            return "Proposals Registration Ended";
        case WorkflowStatus.VotingSessionStarted:
            return "Voting Session Started";
        case WorkflowStatus.VotingSessionEnded:
            return "Voting Session Ended";
        case WorkflowStatus.VotesTallied:
            return "Votes Tallied";
        default:
            return "Unknown Status";
    }
};

const WorkflowStatusDisplay = ({ currentStatus }: WorkflowStatusDisplayProps) => {
    return (
        <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>
                Current Status: {" "}
                <span className="text-blue-500 font-semibold drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    {getStatusText(Number(currentStatus))}
                </span>
            </AlertTitle>
        </Alert>
    );
};

export default WorkflowStatusDisplay; 