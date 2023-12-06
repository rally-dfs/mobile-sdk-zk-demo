// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@opengsn/ERC2771Recipient.sol";

import "./AttestValidMoveVerifier.sol";
import "./RevealMoveVerifier.sol";
import "./IMinimalERC20.sol";

/// @title RPS
/// @author botdad
/// @notice On chain rock paper scissors game using zkp
contract RPS is ERC2771Recipient {
    /// -----------------------------------------------------------------------
    /// Errors
    /// -----------------------------------------------------------------------
    error ErrorInvalidProof();
    error ErrorInvalidMove();
    error ErrorRoundHasMove();
    error ErrorUnauthorized();
    error ErrorNoMove2();
    error ErrorInvalidMaxRoundTime();

    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------
    event RoundStarted(uint256 indexed roundId, uint256 wager, uint64 maxRoundTime);
    event Move2Played(uint256 indexed roundId);
    event RoundEnded(uint256 indexed roundId, uint256 indexed winner);

    /// -----------------------------------------------------------------------
    /// Custom types
    /// -----------------------------------------------------------------------
    struct Round {
        address player1;
        address player2;
        uint256 move1Attestation;
        uint256 wager;
        // all of the following can fit together in a 256 bit word
        uint32 nonce;
        uint64 maxRoundTime;
        uint64 startedAt;
        uint64 move2PlayedAt;
        uint8 move1;
        uint8 move2;
        uint8 winner;
        bool ended;
    }

    struct StartParams {
        uint256[8] proof;
        uint256 moveAttestation;
        uint32 nonce;
        uint64 maxRoundTime;
        // Permit signature fields
        uint256 permitAmount;
        uint256 permitDeadline;
        uint8 permitV;
        bytes32 permitR;
        bytes32 permitS;
    }

    struct Move2Params {
        uint256 roundId;
        uint8 move;
        // Permit signature fields
        uint256 permitDeadline;
        uint8 permitV;
        bytes32 permitR;
        bytes32 permitS;
    }

    struct EndParams {
        uint256[8] proof;
        uint256 roundId;
        uint8 move1;
    }

    /// -----------------------------------------------------------------------
    /// Immutable parameters
    /// -----------------------------------------------------------------------
    uint8 public immutable DEAD_MOVE = 3;
    IMinimalERC20 public immutable wagerToken;

    /// -----------------------------------------------------------------------
    /// Storage variables
    /// -----------------------------------------------------------------------
    uint256 public totalRounds;
    Round[] public rounds;

    constructor(address _wagerToken, address _forwarder) {
        wagerToken = IMinimalERC20(_wagerToken);
        _setTrustedForwarder(_forwarder);
    }

    /// -----------------------------------------------------------------------
    /// User actions
    /// -----------------------------------------------------------------------

    /// @notice Starts a new round and opens up play
    /// @dev Requires a valid AttestValidMove zk proof created off chain
    /// @param params The params necessary to start a round, encoded as `StartParams` in calldata
    function startRound(StartParams calldata params) external {
        /// -------------------------------------------------------------------
        /// Validation
        /// -------------------------------------------------------------------
        if (!AttestValidMoveVerifier.verifyProof(params.proof, params.moveAttestation)) {
            revert ErrorInvalidProof();
        }

        if (params.permitAmount > 0 && params.maxRoundTime == 0) {
            revert ErrorInvalidMaxRoundTime();
        }

        /// -------------------------------------------------------------------
        /// State updates
        /// -------------------------------------------------------------------
        
        address sender = _msgSender();
        Round memory round = Round(
            sender,
            address(0),
            params.moveAttestation,
            params.permitAmount,
            params.nonce,
            params.maxRoundTime,
            uint64(block.timestamp),
            0, // move 2 not played yet
            DEAD_MOVE,
            DEAD_MOVE,
            0, // winner is tie until end
            false
        );
        rounds.push(round);
        unchecked {
            ++totalRounds;
        }

        /// -------------------------------------------------------------------
        /// Effects
        /// -------------------------------------------------------------------
        if (params.permitAmount > 0) {
            wagerToken.permit(
                sender,
                address(this),
                params.permitAmount,
                params.permitDeadline,
                params.permitV,
                params.permitR,
                params.permitS
            );
            wagerToken.transferFrom(sender, address(this), params.permitAmount);
        }

        emit RoundStarted(rounds.length - 1, params.permitAmount, params.maxRoundTime);
    }

    /// @notice Responds to an existing open round with a move
    /// @param params The params necessary to submit a move2, encoded as `Move2Params` in calldata
    function submitMove2(Move2Params calldata params) external {
        /// -------------------------------------------------------------------
        /// Validation
        /// -------------------------------------------------------------------
        Round memory round = rounds[params.roundId];

        if (round.ended || round.move2 != DEAD_MOVE) {
            revert ErrorRoundHasMove();
        }

        if (params.move > 2) {
            revert ErrorInvalidMove();
        }

        /// -------------------------------------------------------------------
        /// State updates
        /// -------------------------------------------------------------------
        address sender = _msgSender();
        round.move2 = params.move;
        round.player2 = sender;
        round.move2PlayedAt = uint64(block.timestamp);

        rounds[params.roundId] = round;

        /// -------------------------------------------------------------------
        /// Effects
        /// -------------------------------------------------------------------
        if (round.wager > 0) {
            wagerToken.permit(
                sender,
                address(this),
                round.wager,
                params.permitDeadline,
                params.permitV,
                params.permitR,
                params.permitS
            );
            wagerToken.transferFrom(sender, address(this), round.wager);
        }

        emit Move2Played(params.roundId);
    }

    /// @notice Starts a new round and opens up play
    /// @dev Requires a valid RevealMove zk proof created off chain
    /// @param params The params necessary to end a round, encoded as `EndParams` in calldata
    function endRound(EndParams calldata params) external {
        /// -------------------------------------------------------------------
        /// Validation
        /// -------------------------------------------------------------------
        Round memory round = rounds[params.roundId];

        if (round.ended || round.move1 != DEAD_MOVE) {
            revert ErrorRoundHasMove();
        }

        if (round.move2 == DEAD_MOVE) {
            revert ErrorNoMove2();
        }

        if (params.move1 == DEAD_MOVE) {
            revert ErrorInvalidMove();
        }

        if (!RevealMoveVerifier.verifyProof(params.proof, params.move1, round.move1Attestation)) {
            revert ErrorInvalidProof();
        }

        /// -------------------------------------------------------------------
        /// State updates
        /// -------------------------------------------------------------------
        round.move1 = params.move1;
        round.ended = true;

        if (round.move1 > round.move2) {
            unchecked {
                uint8 diff = round.move1 - round.move2;
                round.winner = diff == 1 ? 1 : 2;
            }
        } else if (round.move1 < round.move2) {
            unchecked {
                uint8 diff = round.move2 - round.move1;
                round.winner = diff == 1 ? 2 : 1;
            }
        } // else tie, no winner

        rounds[params.roundId] = round;

        /// -------------------------------------------------------------------
        /// Effects
        /// -------------------------------------------------------------------
        if (round.wager > 0) {
            if (round.winner == 1) {
                wagerToken.transfer(round.player1, round.wager * 2);
            } else if (round.winner == 2) {
                wagerToken.transfer(round.player2, round.wager * 2);
            } else {
                wagerToken.transfer(round.player1, round.wager);
                wagerToken.transfer(round.player2, round.wager);
            }
        }

        emit RoundEnded(params.roundId, round.winner);
    }

    /// @notice Claim winnings for player 2 if player 1 has not revealed the winner in time
    /// @param roundId the id of the round in a forfeit state
    function collectForfeit(uint256 roundId) external {
        /// -------------------------------------------------------------------
        /// Validation
        /// -------------------------------------------------------------------
        Round memory round = rounds[roundId];

        if (round.maxRoundTime == 0) {
            revert ErrorUnauthorized();
        }

        if (round.ended) {
            revert ErrorUnauthorized();
        }

        if (block.timestamp < round.move2PlayedAt + round.maxRoundTime) {
            revert ErrorUnauthorized();
        }

        /// -------------------------------------------------------------------
        /// State updates
        /// -------------------------------------------------------------------
        round.ended = true;
        rounds[roundId] = round;

        /// -------------------------------------------------------------------
        /// Effects
        /// -------------------------------------------------------------------
        wagerToken.transfer(round.player2, round.wager * 2);

        emit RoundEnded(roundId, 2);
    }

    /// -------------------------------------------------------------------
    /// Views
    /// -------------------------------------------------------------------

    /// @notice Gets single round of play
    /// @param roundId id of the round
    /// @return round
    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    /// @notice Gets all rounds of play
    /// @return rounds all rounds
    function getRounds() external view returns (Round[] memory) {
        return rounds;
    }

    /// @notice Gets per player nonce for signature generation
    /// @return nonce nonce to use for signature generation
    function getNonce() external view returns (uint256 nonce) {
        address sender = _msgSender();
        for (uint256 i = 0; i < rounds.length; i++) {
            Round memory round = rounds[i];
            if (round.player1 == sender) {
                nonce++;
            }
        }
    }
}
