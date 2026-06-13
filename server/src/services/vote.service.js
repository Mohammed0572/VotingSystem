/**
 * Vote Service
 * Business logic for casting votes and checking vote status.
 * Includes blockchain integration hooks.
 */

const { Vote, Election } = require('../models');
const ApiError = require('../utils/ApiError');
const blockchainService = require('./blockchain.service');

class VoteService {
  /**
   * Cast a vote in an election.
   * @param {string} voterId - User's MongoDB _id
   * @param {string} electionId
   * @param {string} candidateId
   * @returns {Object} vote record
   */
  async castVote(voterId, electionId, candidateId) {
    // 1. Verify election exists and is active
    const election = await Election.findOne({ _id: { $eq: electionId } });
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    const status = election.computeStatus();
    if (status !== 'active') {
      throw ApiError.badRequest(
        status === 'upcoming'
          ? 'This election has not started yet.'
          : 'This election has already ended.'
      );
    }

    // 2. Verify candidate exists in this election
    const candidate = election.candidates.id(candidateId);
    if (!candidate) {
      throw ApiError.notFound('Candidate not found in this election.');
    }

    // 3. Check if user already voted (compound unique index will also catch this)
    const existingVote = await Vote.findOne({ election: { $eq: electionId }, voter: { $eq: voterId } });
    if (existingVote) {
      throw ApiError.conflict('You have already voted in this election.');
    }

    // 4. Create vote record
    const vote = await Vote.create({
      election: electionId,
      voter: voterId,
      candidateId,
    });

    // 5. Increment candidate vote count and total votes
    await Election.findOneAndUpdate(
      { _id: { $eq: electionId }, 'candidates._id': { $eq: candidateId } },
      {
        $inc: {
          'candidates.$.voteCount': 1,
          totalVotes: 1,
        },
      }
    );

    // 6. Submit to blockchain (future)
    if (blockchainService.isEnabled()) {
      const txResult = await blockchainService.submitVote(
        electionId,
        candidateId,
        voterId
      );
      vote.blockchainTxHash = txResult.txHash;
      await vote.save();
    }

    return {
      voteId: vote._id,
      election: electionId,
      candidateId,
      blockchainTxHash: vote.blockchainTxHash,
      timestamp: vote.createdAt,
    };
  }

  /**
   * Check if a user has voted in a specific election.
   * @param {string} voterId
   * @param {string} electionId
   * @returns {Object} { hasVoted, voteId }
   */
  async getVoteStatus(voterId, electionId) {
    const election = await Election.findOne({ _id: { $eq: electionId } });
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    const vote = await Vote.findOne({ election: { $eq: electionId }, voter: { $eq: voterId } });

    return {
      hasVoted: !!vote,
      voteId: vote?._id || null,
      electionId,
      timestamp: vote?.createdAt || null,
    };
  }
}

module.exports = new VoteService();
