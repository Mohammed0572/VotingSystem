// @ts-nocheck
/**
 * Election Controller
 * Handles HTTP layer for election management endpoints.
 */

import electionService from '../services/election.service';
import ApiResponse from '../utils/ApiResponse';

class ElectionController {
  /**
   * POST /api/elections
   * Create a new election (admin only).
   */
  async createElection(req, res, next) {
    try {
      const election = await electionService.createElection(req.body, req.user._id);

      ApiResponse.created({ election }, 'Election created successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/elections
   * Get all elections with optional filters.
   */
  async getAllElections(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await electionService.getAllElections({
        status,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
      });

      ApiResponse.ok(result, 'Elections retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/elections/:id
   * Get a single election by ID.
   */
  async getElection(req, res, next) {
    try {
      const election = await electionService.getElectionById(req.params.id);

      ApiResponse.ok({ election }, 'Election retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/elections/:id
   * Update election details (admin only).
   */
  async updateElection(req, res, next) {
    try {
      const election = await electionService.updateElection(req.params.id, req.body);

      ApiResponse.ok({ election }, 'Election updated successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/elections/:id
   * Delete an election (admin only).
   */
  async deleteElection(req, res, next) {
    try {
      await electionService.deleteElection(req.params.id);

      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/elections/:id/candidates
   * Add a candidate to an election (admin only).
   */
  async addCandidate(req, res, next) {
    try {
      const election = await electionService.addCandidate(req.params.id, req.body);

      ApiResponse.created({ election }, 'Candidate added successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/elections/:id/results
   * Get election results.
   */
  async getResults(req, res, next) {
    try {
      const results = await electionService.getResults(req.params.id);

      ApiResponse.ok({ results }, 'Results retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new ElectionController();

