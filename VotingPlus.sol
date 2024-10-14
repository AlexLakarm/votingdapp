// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.26;

import "hardhat/console.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

//Voting, plus : unregister a voter, remove a proposal, delegate vote to an address, vote sessions

contract VotingPlus is Ownable {

    struct Voter {
        bool isRegistered;
        uint userProposalCount;
        bool hasVoted;
        uint votedProposalId;
        address delegatedTo; 
    }

    struct Proposal {
        address proposer;
        uint proposalId;
        uint voteCount;
        string description;
        bool isActive;
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
    
    uint256 public votingSessionId;   // Initialized in constructor, +1 in the openRegistration() function for each session
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
    event VotingSessionOpened(WorkflowStatus newStatus, uint votingSessionId, string message);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus, uint votingSessionId, string message);
    event ProposalRegistered(uint proposalId);
    event ProposalRemoved(uint proposalId, string message);
    event Voted(address voter, uint proposalId);
    event Tallied(uint proposalId, uint voteCount, string message);

    // Workflow functions

    function openRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Unable to open voters registration at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.RegisteringVoters;
        votingSessionId += 1;
        registeredCount = 1;
        sessionProposalsCount = 0;
        votesCount = 0;
        tallied = false;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "New voters registration phase opened");
    }

    function openProposalsRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Cannot start proposals registration at this stage"); 
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "New proposals registration opened."); 
    }

    function endProposalsRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Cannot end proposals registration at this stage"); 
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "Proposals registration ended.");
    }

    function openVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Cannot start voting session at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "Voting session started.");
    }

    function endVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Cannot end voting session at this stage");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "Voting session ended.");
    }

    function endVotesTally() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Unable to end tally");
        require(tallied == true, "Votes not tallied yet");
        WorkflowStatus previousStatus = workflowStatus;
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(previousStatus, workflowStatus, votingSessionId, "Votes tallied !");
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

    modifier hasActiveProposals() {
        bool activeProposalExists = false;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].isActive) {
                activeProposalExists = true;
                break;  // We stop if there is one active proposal
            }
        }

        require(activeProposalExists, "There are no active proposals");
        _;
    }

    constructor() Ownable(msg.sender) {
        workflowStatus = WorkflowStatus.RegisteringVoters;
        votingSessionId = 1;
        voter[msg.sender] = Voter(true, 0, false, 0, address(0)); // Owner registered by default + default parameters: userProposalCount = 0, hasVoted = false, votedProposalId = 0 and delegatedTo = address(0)
        registeredCount += 1;
        registeredCount = 1;

        emit VotingSessionOpened(workflowStatus, votingSessionId, "First voters registration phase opened");
    }

    function viewVotePhase() public view returns (WorkflowStatus) {
        return workflowStatus;
    }

    // First phase: registering voters + delegated address

    function register(address _address) public onlyOwner onlyDuringRegistration {
        require(!voter[_address].isRegistered, "Address already registered");
        voter[_address] = Voter(true, 0, false, 0, address(0)); // Voter registered + default parameters: userProposalCount = 0, hasVoted = false, votedProposalId = 0 and delegatedTo = address(0)
        registeredCount += 1;
        emit VoterRegistered(_address, "Address successfully registered as a voter");
    }

    function unregister(address _address) public onlyOwner onlyDuringRegistration {
        require(voter[_address].isRegistered, "Address not registered");
        require(_address != owner(), "Admin should remain registered");
        voter[_address].isRegistered = false;
        registeredCount -= 1;
        emit VoterUnregistered(_address, "Address now unregistered and unable to vote");
    }

    function checkIfRegistered(address _address) public view returns (bool) {
        return voter[_address].isRegistered;
    }

    function delegateVote(address _to) public onlyDuringRegistration isCallerRegistered {
        require(voter[_to].isRegistered, "Delegate address is not registered");
        require(!voter[msg.sender].hasVoted, "You have already voted");
        require(_to != msg.sender, "You cannot delegate your vote to yourself");

        // Set the delegate for the voter
        voter[msg.sender].delegatedTo = _to;

        emit VoteDelegated(msg.sender, _to);
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
            description: _proposal,
            isActive: true
        }));

        voter[msg.sender].userProposalCount += 1;

        emit ProposalRegistered(proposalId);
    }

    // Admin should be able to set a proposal to inactive through a function if it does not comply with the rules

    function removeProposal(uint _proposalId) public onlyOwner {
        require(_proposalId > 0 && _proposalId <= proposals.length, "Invalid proposal Id");

        Proposal storage proposal = proposals[_proposalId - 1]; // Get the proposal by ID

        require(proposal.isActive, "Proposal already removed or inactive");

        proposal.isActive = false;

        emit ProposalRemoved(_proposalId, "Proposal successfully removed by admin");
    }

    function checkProposal(uint _proposalId) public view returns (Proposal memory) {
        require(_proposalId > 0 && _proposalId <= proposals.length, "Invalid proposal Id");
        return proposals[_proposalId - 1];
    }

    // Third phase: Vote!

    function vote(uint _proposalId) public onlyDuringVotingPhase isCallerRegistered {
        require(!voter[msg.sender].hasVoted, "Voter has already voted");
        require(_proposalId > 0 && _proposalId <= proposals.length, "Proposal Id not valid");
        require(proposals[_proposalId - 1].isActive, "Proposal inactive following admin decision");

        voter[msg.sender].hasVoted = true;
        voter[msg.sender].votedProposalId = _proposalId;

        proposals[_proposalId - 1].voteCount += 1;
        votesCount += 1;

        emit Voted(msg.sender, _proposalId);
    }

    function voteWithDelegation(uint _proposalId, address _voteFor) public onlyDuringVotingPhase {
        require(voter[_voteFor].delegatedTo == msg.sender, "You are not the delegate of this voter");
        require(!voter[_voteFor].hasVoted, "Delegate has already voted");
        require(_proposalId > 0 && _proposalId <= proposals.length, "Proposal Id not valid");
        require(proposals[_proposalId - 1].isActive, "Proposal inactive following admin decision");

        voter[_voteFor].hasVoted = true;
        voter[_voteFor].votedProposalId = _proposalId;

        proposals[_proposalId - 1].voteCount += 1;
        votesCount += 1;

        emit Voted(_voteFor, _proposalId);
    }

    // Fourth phase: tally
    // In case of a tie, the winning proposal is the one proposed first 

    function tallyVotes() public onlyOwner onlyDuringTallyPhase hasActiveProposals {
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
