// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title A voting system contract
/// @author Alexandre Kermarec
/// @notice This contract manages a complete voting workflow with registration, proposals, and voting phases
/// @dev Inherits from OpenZeppelin's Ownable contract for admin functionality
contract Voting is Ownable {

    /// @notice ID of the winning proposal
    uint public winningProposalID;
    
    /// @notice Structure to store voter information
    /// @dev Includes registration status, proposal count, voting status and vote choice
    struct Voter {
        bool isRegistered;      // Whether the voter is registered
        uint nbProposals;       // Number of proposals submitted by this voter
        bool hasVoted;          // Whether the voter has cast their vote
        uint votedProposalId;   // ID of the proposal this voter voted for
    }

    /// @notice Structure to store proposal information
    /// @dev Includes proposal description and vote count
    struct Proposal {
        string description;     // Description of the proposal
        uint voteCount;         // Number of votes received
    }

    /// @notice Enum representing the different states of the voting workflow
    enum WorkflowStatus {
        RegisteringVoters,          // Admin registers voters
        ProposalsRegistrationStarted, // Registered voters can submit proposals
        ProposalsRegistrationEnded,   // Proposal submission period is closed
        VotingSessionStarted,         // Registered voters can vote
        VotingSessionEnded,           // Voting period is closed
        VotesTallied                  // Votes have been counted and winner determined
    }

    /// @notice Current status of the voting workflow
    WorkflowStatus public workflowStatus;
    
    /// @notice Array storing all proposals
    Proposal[] proposalsArray;
    
    /// @notice Mapping of voter addresses to their information
    mapping (address => Voter) voters;

    /// @notice Emitted when a new voter is registered
    /// @param voterAddress Address of the registered voter
    event VoterRegistered(address voterAddress); 
    
    /// @notice Emitted when the workflow status changes
    /// @param previousStatus The previous workflow status
    /// @param newStatus The new workflow status
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    
    /// @notice Emitted when a new proposal is registered
    /// @param proposalId ID of the registered proposal
    event ProposalRegistered(uint proposalId);
    
    /// @notice Emitted when a vote is cast
    /// @param voter Address of the voter
    /// @param proposalId ID of the proposal voted for
    event Voted (address voter, uint proposalId);

    /// @notice Contract constructor
    /// @dev Sets the contract deployer as the owner
    constructor() Ownable(msg.sender) {    }
    
    /// @notice Modifier to restrict function access to registered voters only
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // GETTERS

    /// @notice Gets a voter's information
    /// @param _addr Address of the voter to query
    /// @return Voter Returns the voter's information
    /// @dev Only registered voters can call this function
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }
    
    /// @notice Gets a proposal's information
    /// @param _id ID of the proposal to query
    /// @return Proposal Returns the proposal's information
    /// @dev Only registered voters can call this function
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /// @notice Gets the total number of proposals
    /// @return uint Returns the total number of proposals
    function getProposalsCount() external view returns (uint) {
        return proposalsArray.length;
    }

    // REGISTRATION

    /// @notice Registers a new voter
    /// @param _addr Address of the voter to register
    /// @dev Only the owner can register voters and only during the RegisteringVoters phase
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');
    
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    // PROPOSAL

    /// @notice Adds a new proposal
    /// @param _desc Description of the proposal
    /// @dev Only registered voters can add proposals during the ProposalsRegistrationStarted phase
    function addProposal(string calldata _desc) external onlyVoters {
        require(proposalsArray.length < 1000, "Maximum number of proposals reached");
        require(voters[msg.sender].nbProposals < 3, "Maximum number of 3 proposals per user reached");
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer');

        Proposal memory proposal;
        proposal.description = _desc;
        ++voters[msg.sender].nbProposals;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // VOTE

    /// @notice Allows a voter to cast their vote
    /// @param _id ID of the proposal to vote for
    /// @dev Only registered voters can vote, only once, during the VotingSessionStarted phase
    function setVote(uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        emit Voted(msg.sender, _id);
    }

    // STATE MANAGEMENT

    /// @notice Starts the proposal registration phase
    /// @dev Only the owner can call this function
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        
        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);
        
        emit ProposalRegistered(0);
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice Ends the proposal registration phase
    /// @dev Only the owner can call this function
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Starts the voting session
    /// @dev Only the owner can call this function
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice Ends the voting session
    /// @dev Only the owner can call this function
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// @notice Tallies the votes and determines the winning proposal
    /// @dev Only the owner can call this function. The proposal with the most votes wins
    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                _winningProposalId = p;
            }
        }
        winningProposalID = _winningProposalId;
        
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}
