/**
 * Election Service
 * Business logic for election CRUD and candidate management.
 */

const { Election } = require('../models');
const ApiError = require('../utils/ApiError');
const blockchainService = require('./blockchain.service');

class ElectionService {
  /**
   * Create a new election.
   * @param {Object} electionData
   * @param {string} createdBy - Admin user ID
   * @returns {Object} election
   */
  async createElection(electionData, createdBy) {
    const election = await Election.create({
      ...electionData,
      createdBy,
    });

    // Placeholder: Deploy election contract on blockchain
    if (blockchainService.isEnabled()) {
      const txResult = await blockchainService.deployElection({
        electionId: election._id.toString(),
        title: election.title,
        candidates: election.candidates,
      });
      election.blockchainTxHash = txResult.txHash;
      election.contractAddress = txResult.contractAddress;
      await election.save();
    }

    return election;
  }

  /**
   * Get all elections with optional filtering and pagination.
   * @param {Object} query - { status, page, limit }
   * @returns {Object} { elections, total, page, pages }
   */
  async getAllElections({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (typeof status === 'string') filter.status = { $eq: status };

    const skip = (page - 1) * limit;

    const [elections, total] = await Promise.all([
      Election.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Election.countDocuments(filter),
    ]);

    // Auto-update status based on current time
    const now = new Date();
    const updatedElections = elections.map((election) => {
      let computedStatus = election.status;
      if (now < new Date(election.startDate)) computedStatus = 'upcoming';
      else if (now >= new Date(election.startDate) && now <= new Date(election.endDate)) computedStatus = 'active';
      else computedStatus = 'completed';
      return { ...election, status: computedStatus };
    });

    return {
      elections: updatedElections,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single election by ID.
   * @param {string} electionId
   * @returns {Object} election
   */
  async getElectionById(electionId) {
    const election = await Election.findOne({ _id: { $eq: electionId } })
      .populate('createdBy', 'name email');

    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    // Auto-update status
    const newStatus = election.computeStatus();
    if (election.status !== newStatus) {
      election.status = newStatus;
      await election.save();
    }

    return election;
  }

  /**
   * Update election details (admin only, before it starts).
   * @param {string} electionId
   * @param {Object} updateData
   * @returns {Object} updated election
   */
  async updateElection(electionId, updateData) {
    const election = await Election.findOne({ _id: { $eq: electionId } });
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    // Prevent modification of active/completed elections
    const currentStatus = election.computeStatus();
    if (currentStatus === 'active' || currentStatus === 'completed') {
      throw ApiError.badRequest(`Cannot modify an election that is ${currentStatus}.`);
    }

    Object.assign(election, updateData);
    await election.save();

    return election;
  }

  /**
   * Delete an election (admin only, before it starts).
   * @param {string} electionId
   */
  async deleteElection(electionId) {
    const election = await Election.findOne({ _id: { $eq: electionId } });
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    const currentStatus = election.computeStatus();
    if (currentStatus === 'active') {
      throw ApiError.badRequest('Cannot delete an active election.');
    }

    await Election.findOneAndDelete({ _id: { $eq: electionId } });
  }

  /**
   * Add a candidate to an election.
   * @param {string} electionId
   * @param {Object} candidateData - { name, party }
   * @returns {Object} updated election
   */
  async addCandidate(electionId, candidateData) {
    const election = await Election.findOne({ _id: { $eq: electionId } });
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    const currentStatus = election.computeStatus();
    if (currentStatus !== 'upcoming') {
      throw ApiError.badRequest('Candidates can only be added to upcoming elections.');
    }

    // Check for duplicate candidate names
    const isDuplicate = election.candidates.some(
      (c) => c.name.toLowerCase() === candidateData.name.toLowerCase()
    );
    if (isDuplicate) {
      throw ApiError.conflict(`Candidate "${candidateData.name}" already exists.`);
    }

    election.candidates.push(candidateData);
    await election.save();

    return election;
  }

  /**
   * Get election results (vote counts per candidate).
   * @param {string} electionId
   * @returns {Object} results
   */
  async getResults(electionId) {
    const election = await Election.findOne({ _id: { $eq: electionId } }).lean();
    if (!election) {
      throw ApiError.notFound('Election not found.');
    }

    // Try blockchain results first (future)
    if (blockchainService.isEnabled()) {
      const blockchainResults = await blockchainService.getResults(electionId);
      return {
        election: {
          id: election._id,
          title: election.title,
          status: election.status,
          totalVotes: election.totalVotes,
        },
        candidates: blockchainResults.candidates,
        source: 'blockchain',
      };
    }

    // Fall back to database results
    return {
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
        totalVotes: election.totalVotes,
      },
      candidates: election.candidates.map((c) => ({
        id: c._id,
        name: c.name,
        party: c.party,
        voteCount: c.voteCount,
      })),
      source: 'database',
    };
  }
}

module.exports = new ElectionService();
