/**
 * Election Model
 * Stores elections with embedded candidates, date constraints, and auto-status computation.
 */

const mongoose = require('mongoose');
const { ELECTION_STATUS } = require('../utils/constants');

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    party: {
      type: String,
      trim: true,
      default: 'Independent',
    },
    voteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Election title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    candidates: {
      type: [candidateSchema],
      validate: {
        validator: function (v) {
          return v.length >= 0; // Candidates can be added after creation
        },
        message: 'Candidates array is invalid',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: Object.values(ELECTION_STATUS),
      default: ELECTION_STATUS.UPCOMING,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ── Future: Blockchain Integration ────────────────
    blockchainTxHash: {
      type: String,
      default: null,
    },
    contractAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────
electionSchema.index({ status: 1 });
electionSchema.index({ startDate: 1, endDate: 1 });
electionSchema.index({ createdBy: 1 });

// ── Validation: endDate > startDate ──────────────────────
electionSchema.pre('validate', function (next) {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

// ── Virtual: isActive ────────────────────────────────────
electionSchema.virtual('isActive').get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

// ── Method: Compute status from dates ────────────────────
electionSchema.methods.computeStatus = function () {
  const now = new Date();
  if (now < this.startDate) return ELECTION_STATUS.UPCOMING;
  if (now >= this.startDate && now <= this.endDate) return ELECTION_STATUS.ACTIVE;
  return ELECTION_STATUS.COMPLETED;
};

const Election = mongoose.model('Election', electionSchema);

module.exports = Election;
