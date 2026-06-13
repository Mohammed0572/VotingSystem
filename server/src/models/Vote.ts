// @ts-nocheck
/**
 * Vote Model
 * Records individual votes with compound unique index to prevent double voting.
 */

import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: [true, 'Election ID is required'],
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Voter ID is required'],
    },
    candidateId: {
      type: String,
      required: [true, 'Candidate ID is required'],
    },
    // ── Future: Blockchain Integration ────────────────
    blockchainTxHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Votes are immutable
  }
);

// ── Compound Unique Index: One vote per election per voter ─
voteSchema.index({ election: 1, voter: 1 }, { unique: true });
voteSchema.index({ election: 1, candidateId: 1 });

const Vote = mongoose.model('Vote', voteSchema);

export default Vote;

