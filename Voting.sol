// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.26;

import "hardhat/console.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {

    struct Voter {
        bool isRegistered;
        uint userProposalCount;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        address proposer;
        uint proposalId;
        uint voteCount;
        string description;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    Proposal[] public proposals;
    mapping (address => Voter) public voter;
    
    uint256 public registeredCount;    // Reset in the openRegistration() function
    uint256 public proposalsCount;     // A unique Id for each proposal across several sessions
    uint256 public sessionProposalsCount; // Reset in the openRegistration() function
    uint256 public votesCount;         // Reset in the openRegistration() function
    uint256 public winningProposalId;  // Reset in the tally function at the end of the voting process
    bool public tallied;
    
    WorkflowStatus public workflowStatus;

    event VoterRegistered(address _address, string message);
    event VoterUnregistered(address _address, string message);
    event VoteDelegated(address from, address to);
    event VotingSessionOpened(WorkflowStatus newStatus, string message);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus, string message);
    event ProposalRegistered(uint proposalId);
    event ProposalRemoved(uint proposalId, string message);
    event Voted(address voter, uint proposalId);
    event Tallied(uint proposalId, uint voteCount, string message);

    // Workflow functions

    function openRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Unable to open voters registration at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.RegisteringVoters;
        registeredCount = 1;
        sessionProposalsCount = 0;
        votesCount = 0;
        tallied = false;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "New voters registration phase opened");
    }

    function openProposalsRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Cannot start proposals registration at this stage"); 
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "New proposals registration opened."); 
    }

    function endProposalsRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Cannot end proposals registration at this stage"); 
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "Proposals registration ended.");
    }

    function openVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Cannot start voting session at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "Voting session started.");
    }

    function endVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Cannot end voting session at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "Voting session ended.");
    }

    function endVotesTally() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Unable to end tally");
        require(tallied == true, "Votes not tallied yet");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(previousStatus, workflowStatus, "Votes tallied !");
    }

    // Workflow functions end

    modifier isCallerRegistered() {     
        require(voter[msg.sender].isRegistered, "Address not registered for the vote");
        _;
    }

    modifier onlyDuringRegistration() { 
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Must be in the registering voters phase");
        _;
    }

    modifier onlyDuringProposalsPhase() { 
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposals registration phase must be opened");
        _;
    }

    modifier onlyDuringVotingPhase() { 
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Voting phase must be opened");
        _;
    }    
        
    modifier onlyDuringTallyPhase() { 
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Voting phase must be closed");
        _;
    }

    modifier onlyAfterVotesTallied() { 
        require(workflowStatus == WorkflowStatus.VotesTallied, "Tally phase must be closed");
        _;
    }

    constructor() Ownable(msg.sender) {
        workflowStatus = WorkflowStatus.RegisteringVoters;
        voter[msg.sender] = Voter(true, 0, false, 0); // Owner registered by default + default parameters: userProposalCount = 0, hasVoted = false, votedProposalId = 0 
        registeredCount += 1;
        registeredCount = 1;

        emit VotingSessionOpened(workflowStatus, "First voters registration phase opened");
    }

    function viewVotePhase() public view returns (WorkflowStatus) {
        return workflowStatus;
    }

    // First phase: registering voters

    function register(address _address) public onlyOwner onlyDuringRegistration {
        require(!voter[_address].isRegistered, "Address already registered");
        voter[_address] = Voter(true, 0, false, 0); // Voter registered + default parameters: userProposalCount = 0, hasVoted = false, votedProposalId = 0 
        registeredCount += 1;
        emit VoterRegistered(_address, "Address successfully registered as a voter");
    }

    function checkIfRegistered(address _address) public view returns (bool) {
        return voter[_address].isRegistered;
    }

    // Second phase: proposals registration
    // Max 2 proposals per user 

    function newProposal(string memory _proposal) public onlyDuringProposalsPhase isCallerRegistered {
        require(voter[msg.sender].userProposalCount < 2, "You have already submitted 2 proposals.");

        proposalsCount += 1; 
        uint proposalId = proposalsCount; 
        sessionProposalsCount += 1; 

        proposals.push(Proposal({
            proposer: msg.sender,
            proposalId: proposalId,
            voteCount: 0,
            description: _proposal
        }));

        voter[msg.sender].userProposalCount += 1;

        emit ProposalRegistered(proposalId);
    }

    // Third phase: Vote!

    function vote(uint _proposalId) public onlyDuringVotingPhase isCallerRegistered {
        require(!voter[msg.sender].hasVoted, "Voter has already voted");
        require(_proposalId > 0 && _proposalId <= proposals.length, "Proposal Id not valid");

        voter[msg.sender].hasVoted = true;
        voter[msg.sender].votedProposalId = _proposalId;

        proposals[_proposalId - 1].voteCount += 1;
        votesCount += 1;

        emit Voted(msg.sender, _proposalId);
    }

    // Fourth phase: tally
    // In case of a tie, the winning proposal is the one proposed first 

    function tallyVotes() public onlyOwner onlyDuringTallyPhase {
        require(proposals.length > 0, "Error: no proposals found");  
        uint maxVoteCount = 0;

        for (uint i = 0; i < proposals.length; i++) {
            Proposal memory proposal = proposals[i]; // Loading proposal into memory to save gas
            if (proposal.voteCount > maxVoteCount) {
                maxVoteCount = proposal.voteCount;
                winningProposalId = proposal.proposalId;
            }
        }

        tallied = true;
        emit Tallied(winningProposalId, proposals[winningProposalId - 1].voteCount, "Votes successfully tallied");
    }

    function getWinningProposal() public view onlyAfterVotesTallied returns (Proposal memory) {
        return proposals[winningProposalId - 1];
    }

    // End of voting session
}
