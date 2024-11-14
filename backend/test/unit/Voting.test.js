const { assert, expect } = require("chai"); 
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Voting Contract Tests", function () {

  // ::::::::::::: INITIALIZATION ::::::::::::: //  

  let owner, addr1, addr2, addr3, addr4;
  let voting; 

  const WorkflowStatus = {
    RegisteringVoters: 0,
    ProposalsRegistrationStarted: 1,
    ProposalsRegistrationEnded: 2,
    VotingSessionStarted: 3,
    VotingSessionEnded: 4,
    VotesTallied: 5
  };

  async function deployVotingFixture() {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Voting = await hre.ethers.deployContract("Voting");
    voting = Voting;
    return {owner, addr1, addr2, addr3, addr4, voting};
  }

  beforeEach(async () => {
    const {owner, addr1, addr2, addr3, addr4, voting} = await loadFixture(deployVotingFixture);
  });

  // ::::::::::::: WORKFLOW FIXTURES ::::::::::::: //  

   async function startProposalsRegisteringFixture() {
    let changeToProposalRegistering = await voting.startProposalsRegistering();
    await changeToProposalRegistering.wait();
    }

    async function endProposalsRegisteringFixture() {
        let changeToProposalEnding = await voting.endProposalsRegistering();
        await changeToProposalEnding.wait();
    }

    async function startVotingSessionFixture() {
        let changeToVotingSession = await voting.startVotingSession();
        await changeToVotingSession.wait();
    }

    async function endVotingSessionFixture() {
        let changeToVotingSessionEnding = await voting.endVotingSession();
        await changeToVotingSessionEnding.wait();
    }

  // ::::::::::::: WORKFLOW STATE TESTS ::::::::::::: //  

    describe('Workflow State', function() {
    
        describe('Start Proposals Registering', function() {
            it('Only owner can change workflow state', async function() {
                await expect(voting.connect(addr1).startProposalsRegistering())
                    .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount')
                    .withArgs(addr1.address);
            })
            it('Workflow status should be RegisteringVoters', async function() {
                // First, check that the function runs without error
            await expect(voting.startProposalsRegistering()).to.not.be.reverted;
            // Then, check that the function cannot be called again
                await expect(voting.startProposalsRegistering()).to.be.revertedWith('Registering proposals cant be started now');
            })
            it('Should update the workflow status to ProposalsRegistrationStarted', async function() {
                // We update the workflow state to ProposalsRegistrationStarted - step 2
            await loadFixture(startProposalsRegisteringFixture);
            let workflowStatus = await voting.workflowStatus();
                assert.equal(workflowStatus, WorkflowStatus.ProposalsRegistrationStarted);
                })
            it('Should create a GENESIS proposal', async function() {
                // Adding the owner as a voter since the getOneProposal function is onlyVoters
            await voting.addVoter(owner.address);
            
            await loadFixture(startProposalsRegisteringFixture);
            
            const proposalsCount = await voting.getProposalsCount();
            assert.equal(proposalsCount, 1, "Proposal count should be 1");
            const proposal = await voting.getOneProposal(0);
            assert.equal(proposal.description, "GENESIS", "Proposal description should be GENESIS");
            
            })
            // Events
            it('Should emit an event ProposalRegistered', async function() {
                await expect(voting.startProposalsRegistering())
                    .to.emit(voting, 'ProposalRegistered')
                    .withArgs(0);
            })
            it('Should emit an event WorkflowStatusChange', async function() {
                await expect(voting.startProposalsRegistering())
                    .to.emit(voting, 'WorkflowStatusChange')
                    .withArgs(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
            })
        })
        // Next workflow status
        describe('End Proposals Registering', function() {
            it('Only owner can change workflow state', async function() {
                await expect(voting.connect(addr1).endProposalsRegistering())
                    .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount')
                    .withArgs(addr1.address);
            })
            it('Workflow status should be ProposalsRegistrationStarted', async function() {
                // Current status is RegisteringVoters we can't end proposals registering
                await expect(voting.endProposalsRegistering()).to.be.revertedWith('Registering proposals havent started yet');
            })
            it('Should update the workflow status to ProposalsRegistrationEnded', async function() {
                // We update the workflow state to ProposalsRegistrationEnded - step 3
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            let workflowStatus = await voting.workflowStatus();
                assert.equal(workflowStatus, WorkflowStatus.ProposalsRegistrationEnded);
            })
            // Events
            it('Should emit an event WorkflowStatusChange', async function() {
            await loadFixture(startProposalsRegisteringFixture);
            await expect(voting.endProposalsRegistering())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
            })
        })
        // Next workflow status
        describe('Start Voting Session', function() {
            it('Only owner can change workflow state', async function() {
                await expect(voting.connect(addr1).startVotingSession())
                    .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount')
                    .withArgs(addr1.address);
            })
            it('Workflow status should be ProposalsRegistrationEnded', async function() {
                // Current status is RegisteringVoters we can't start voting sessions
                await expect(voting.startVotingSession()).to.be.revertedWith('Registering proposals phase is not finished');
            })
            it('Should update the workflow status to VotingSessionStarted', async function() {
                // We update the workflow state to VotingSessionStarted - step 4
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await loadFixture(startVotingSessionFixture);
            let workflowStatus = await voting.workflowStatus();
                assert.equal(workflowStatus, WorkflowStatus.VotingSessionStarted);
            })
            // Events
            it('Should emit an event WorkflowStatusChange', async function() {
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await expect(voting.startVotingSession())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
            })
        })
        // Next workflow status
        describe('End Voting Session', function() {
            it('Only owner can change workflow state', async function() {
                await expect(voting.connect(addr1).endVotingSession())
                    .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount')
                    .withArgs(addr1.address);
            })
            it('Workflow status should be VotingSessionStarted', async function() {
                // Current status is RegisteringVoters we can't end voting sessions
                await expect(voting.endVotingSession()).to.be.revertedWith('Voting session havent started yet');
            })
            it('Should update the workflow status to VotingSessionEnded', async function() {
                // We update the workflow state to VotingSessionEnded - step 5
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await loadFixture(startVotingSessionFixture);
            await loadFixture(endVotingSessionFixture);
            let workflowStatus = await voting.workflowStatus();
                assert.equal(workflowStatus, WorkflowStatus.VotingSessionEnded);
            })
            // Events
            it('Should emit an event WorkflowStatusChange', async function() {
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await loadFixture(startVotingSessionFixture);
            await expect(voting.endVotingSession())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
            })
        })
        // Next workflow status
        describe('Tally Votes - only the state part not the tally itself', function() {
            it('Only owner can change workflow state', async function() {
                await expect(voting.connect(addr1).tallyVotes())
                    .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount')
                    .withArgs(addr1.address);
            })
            it('Workflow status should be VotingSessionEnded', async function() {
            // Current status is RegisteringVoters we can't tally votes
                await expect(voting.tallyVotes()).to.be.revertedWith('Current status is not voting session ended');
            })
            it('should update the workflow status to VotesTallied', async function() {
                // We update the workflow state to VotesTallied - step 6
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await loadFixture(startVotingSessionFixture);
            await loadFixture(endVotingSessionFixture);
            let changeToTallying = await voting.tallyVotes();
            await changeToTallying.wait();
            let workflowStatus = await voting.workflowStatus();
                assert.equal(workflowStatus, WorkflowStatus.VotesTallied);
            })
            // Events
            it('Should emit an event WorkflowStatusChange', async function() {
            await loadFixture(startProposalsRegisteringFixture);
            await loadFixture(endProposalsRegisteringFixture);
            await loadFixture(startVotingSessionFixture);
            await loadFixture(endVotingSessionFixture);
            await expect(voting.tallyVotes())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
            })
        })
    })

  // ::::::::::::: VOTING PROCESS TESTS ::::::::::::: //

    describe('Voting Process', function() {
        describe('Registration', function() {
            describe('Add Voter', function() {
                it('Only owner can add a voter', async function() {
                await expect(voting.connect(addr1).addVoter(addr2.address)).to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount');
                })
                it('Workflow status should be RegisteringVoters', async function() {
                await expect(voting.addVoter(addr2.address)).to.not.be.reverted;
                await loadFixture(startProposalsRegisteringFixture);
                await expect(voting.addVoter(addr2.address)).to.be.revertedWith('Voters registration is not open yet');
                })
                it('Voter should not be registered yet', async function() {
                await expect(voting.addVoter(addr2.address)).not.to.be.reverted;
                await expect(voting.addVoter(addr2.address)).to.be.revertedWith('Already registered');
                })
                it('Voter should be registered', async function() {
                // Add owner as a voter to be able to call getVoter
                let addOwner = await voting.addVoter(owner.address);
                await addOwner.wait();
                let addVoter = await voting.addVoter(addr2.address);
                await addVoter.wait();
                let voter = await voting.getVoter(addr2.address);
                assert.equal(voter.isRegistered, true);
                })
                it('Should emit an event VoterRegistered', async function() {
                await expect(voting.addVoter(addr2.address))
                    .to.emit(voting, 'VoterRegistered')
                    .withArgs(addr2.address);
                })
            })
            describe('Get Voter', function() {
                it('Should return the voter', async function() {
                    let addOwner = await voting.addVoter(owner.address);
                await addOwner.wait();
                let voter = await voting.getVoter(owner.address);
                assert.equal(voter.isRegistered, true);
            })
        })
        describe('Proposal', function() {
            beforeEach(async function() {
                let addOwner = await voting.addVoter(owner.address);
                await addOwner.wait();
                let changeToProposalRegistering = await voting.startProposalsRegistering();
                await changeToProposalRegistering.wait();
            })
            describe('Add Proposal', function() {
                // Note: The total limit of 1000 proposals is not directly tested due to test environment constraints.
                // Testing this limit would require creating and registering 334 different voters,
                // each submitting 3 proposals, which would be impractical in a test environment.
                it('Should respect maximum proposals per voter (3)', async function() {
                    await voting.addProposal("Proposal 1");
                    await voting.addProposal("Proposal 2");
                    await voting.addProposal("Proposal 3");
                    
                    await expect(voting.addProposal("Proposal 4"))
                        .to.be.revertedWith("Maximum number of 3 proposals per user reached");
                });

                it('Only voters can add a proposal', async function() {
                    await expect(voting.connect(addr1).addProposal("Proposal 1"))
                        .to.be.revertedWith("You're not a voter");
                });

                it('Workflow status should be ProposalsRegistrationStarted', async function() {
                    await expect(voting.addProposal("Proposal 1")).to.not.be.reverted;
                    let changeToProposalEnding = await voting.endProposalsRegistering();
                    await changeToProposalEnding.wait();
                    await expect(voting.addProposal("Proposal 1"))
                        .to.be.revertedWith('Proposals are not allowed yet');
                });

                it('Proposal description should not be empty', async function() {
                    await expect(voting.addProposal(""))
                        .to.be.revertedWith('Vous ne pouvez pas ne rien proposer');
                });
                it('Should add the proposal with the description', async function() {
                    let addProposal = await voting.addProposal("Proposal 1");
                    await addProposal.wait();
                    let proposalsCount = await voting.getProposalsCount();
                    assert.equal(proposalsCount, 2, "Proposal count should be 2 (genesis + Proposal 1)");  // Added space after 2
                    let proposal = await voting.getOneProposal(1);
                    assert.equal(proposal.description, "Proposal 1", "Proposal description should be Proposal 1");
                })
                it('Should emit an event ProposalRegistered', async function() {
                    await expect(voting.addProposal("Proposal 1"))
                        .to.emit(voting, 'ProposalRegistered')
                        .withArgs(1);
                })  
            })
            describe('Get Proposal', function() {
                it('Should return one proposal', async function() {
                    let addProposal = await voting.addProposal("Proposal 1");
                    await addProposal.wait();
                    let proposal = await voting.getOneProposal(1);
                    assert.equal(proposal.description, "Proposal 1", "Proposal description should be Proposal 1");
                })
                it('Should return the proposals count', async function() {
                    let addProposal = await voting.addProposal("Proposal 1");
                    await addProposal.wait();
                    let proposalsCount = await voting.getProposalsCount();
                    assert.equal(proposalsCount, 2, "Proposal count should be 2(genesis + Proposal 1");
                })
            })
        })
        describe('Vote', function() {

            async function setupVotingProcessFixture() {
                // We add the signers as voters
                let addOwner = await voting.addVoter(owner.address);
                await addOwner.wait();
                let addAddr1 = await voting.addVoter(addr1.address);
                await addAddr1.wait();
                let addAddr2 = await voting.addVoter(addr2.address);
                await addAddr2.wait();
                let addAddr3 = await voting.addVoter(addr3.address);
                await addAddr3.wait();
                // We start the proposals registration
                await loadFixture(startProposalsRegisteringFixture);
                // We create 3 proposals
                let addProposal1 = await voting.addProposal("Proposal 1");
                await addProposal1.wait();
                let addProposal2 = await voting.addProposal("Proposal 2");
                await addProposal2.wait();
                let addProposal3 = await voting.addProposal("Proposal 3");
                await addProposal3.wait();
                // We end the proposals registration
                await loadFixture(endProposalsRegisteringFixture);
                // We start the voting session
                await loadFixture(startVotingSessionFixture);
            }

            beforeEach(async ()=> {
                await loadFixture(setupVotingProcessFixture);
            })

            describe('Set Vote', function() {
                it('Only voters can vote', async function() {
                    await expect(voting.connect(addr4).setVote(0)).to.be.revertedWith("You're not a voter");
                })
                it('Workflow status should be VotingSessionStarted', async function() {
                    await expect(voting.setVote(0)).to.not.be.reverted;
                    await loadFixture(endVotingSessionFixture);
                    await expect(voting.setVote(0)).to.be.revertedWith('Voting session havent started yet');
                })
                it('Should not have already voted', async function() {
                    let voted = await voting.setVote(0);
                    await voted.wait();
                    await expect(voting.setVote(0)).to.be.revertedWith('You have already voted');
                })
                it('Id should be inferior to the proposals count', async function() {
                    // We only created 3 proposals, id 4 does not exist
                    await expect(voting.setVote(4)).to.be.revertedWith('Proposal not found');
                })
                it('Should vote for the proposal and set the hasVoted to true', async function() {
                    let vote = await voting.setVote(0);
                    await vote.wait();
                    let voter = await voting.getVoter(owner.address);
                    assert.equal(voter.votedProposalId, 0, "Voter should have voted for proposal 0");
                    assert.equal(voter.hasVoted, true, "Voter should have voted");
                })
                it('Should emit an event Voted', async function() {
                    let vote = await voting.setVote(0);
                    await vote.wait();
                    await expect(vote)
                        .to.emit(voting, 'Voted')
                        .withArgs(owner.address, 0);
                })
            })
            describe('Tally Votes', function() {
                it('Should tally votes : winning proposal is the first one', async function() {
                    // We add 3 votes
                    let vote1 = await voting.setVote(1);
                    await vote1.wait();
                    let vote2 = await voting.connect(addr1).setVote(1);
                    await vote2.wait();
                    let vote3 = await voting.connect(addr2).setVote(2);
                    await vote3.wait();
                    // We end the voting session
                    await loadFixture(endVotingSessionFixture);
                    // We tally the votes
                    let tallyVotes = await voting.tallyVotes();
                    await tallyVotes.wait();
                    let winningProposalID = await voting.winningProposalID();
                    assert.equal(winningProposalID, 1, "Winning proposal should be proposal 1");
                })
                it('Should tally votes : winning proposal is the second one', async function() {
                    // We add 3 votes
                    let vote1 = await voting.setVote(2);
                    await vote1.wait();
                    let vote2 = await voting.connect(addr1).setVote(3);
                    await vote2.wait();
                    let vote3 = await voting.connect(addr2).setVote(2);
                    await vote3.wait();
                    // We end the voting session
                    await loadFixture(endVotingSessionFixture);
                    // We tally the votes
                    let tallyVotes = await voting.tallyVotes();
                    await tallyVotes.wait();
                    let winningProposalID = await voting.winningProposalID();
                    assert.equal(winningProposalID, 2, "Winning proposal should be proposal 3");
                })
                it('Should tally votes : tie', async function() {
                    // We add 2 votes
                    let vote1 = await voting.setVote(1);
                    await vote1.wait();
                    let vote2 = await voting.connect(addr1).setVote(3);
                    await vote2.wait();
                    // We end the voting session
                    await loadFixture(endVotingSessionFixture);
                    // We tally the votes
                    let tallyVotes = await voting.tallyVotes();
                    await tallyVotes.wait();
                    let winningProposalID = await voting.winningProposalID();
                    assert.equal(winningProposalID, 1, "Winning proposal should be proposal 1");
                })
                it('Should tally votes : no winner, genesis wins', async function() {
                    // We end the voting session
                    await loadFixture(endVotingSessionFixture);
                    // We tally the votes
                    let tallyVotes = await voting.tallyVotes();
                    await tallyVotes.wait();
                    let winningProposalID = await voting.winningProposalID();
                    assert.equal(winningProposalID, 0, "Winning proposal should be proposal 0");
                })
            })
        })
    })  
  })
})      

