// @ts-nocheck
/**
 * User Model
 * Stores voter/admin accounts with bcrypt password hashing.
 * Includes placeholder field for future biometric data.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ROLES, BCRYPT_SALT_ROUNDS } from '../utils/constants';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.VOTER,
    },
    voterId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // ── Future: Biometric Authentication ──────────────
    biometricHash: {
      type: String,
      default: null,
      select: false,
    },
    biometricType: {
      type: String,
      enum: ['fingerprint', 'retina', null],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────
// email and voterId indexes are auto-created by unique: true
userSchema.index({ role: 1 });

// ── Pre-save: Hash Password ─────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ── Instance Methods ─────────────────────────────────────
/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

