# Voting Smart Contract - Test Documentation

This repository contains the test suite for the Voting smart contract. The tests are organized to verify all functionalities of the contract, including workflow state changes, voting process, and event emissions.

## Test Structure

The test suite is divided into two main sections:

### 1. Workflow State Tests

Tests for all state transitions in the voting process:

- **Start Proposals Registering**
  - Ownership verification
  - Workflow status checks
  - GENESIS proposal creation
  - Event emissions

- **End Proposals Registering**
  - State transition validation
  - Event emissions

- **Start Voting Session**
  - Proper state progression
  - Access control

- **End Voting Session**
  - Session termination
  - State updates

- **Tally Votes**
  - Final state transition
  - Access restrictions

### 2. Voting Process Tests

Comprehensive tests for the voting functionality:

#### Registration
- **Add Voter**
  - Owner privileges
  - Voter registration status
  - Event emissions

- **Proposal Management**
  - Proposal addition
  - Empty proposal validation
  - Proposal counting
  - Event emissions

#### Voting
- **Set Vote**
  - Voter validation
  - Vote recording
  - Double voting prevention
  - Event emissions

- **Tally Votes**
  - Various winning scenarios
  - Tie handling
  - GENESIS proposal default case

## Test Fixtures

The test suite uses several fixtures to set up test scenarios:

- `deployVotingFixture`: Basic contract deployment
- `startProposalsRegisteringFixture`: Start proposal registration
- `endProposalsRegisteringFixture`: End proposal registration
- `startVotingSessionFixture`: Start voting session
- `endVotingSessionFixture`: End voting session
- `setupVotingProcessFixture`: Complete setup for voting process

## Running the Tests

To run the tests:

```shell
npx hardhat test
```
