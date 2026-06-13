// @ts-nocheck
/**
 * Vote Controller
 * Handles HTTP layer for voting endpoints.
 */

import voteService from '../services/vote.service';
import ApiResponse from '../utils/ApiResponse';

class VoteController {
  /**
   * POST /api/votes
   * Cast a vote in an election.
   */
  async castVote(req, res, next) {
    try {
      const { electionId, candidateId } = req.body;
      const result = await voteService.castVote(req.user._id, electionId, candidateId);

      ApiResponse.created({ vote: result }, 'Vote cast successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/votes/status/:electionId
   * Check if the current user has voted in a specific election.
   */
  async getVoteStatus(req, res, next) {
    try {
      const status = await voteService.getVoteStatus(req.user._id, req.params.electionId);

      ApiResponse.ok({ status }, 'Vote status retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new VoteController();

