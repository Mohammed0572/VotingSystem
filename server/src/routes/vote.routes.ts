// @ts-nocheck
/**
 * Vote Routes
 * POST /api/votes                    — Cast a vote
 * GET  /api/votes/status/:electionId — Check vote status
 */

import { Router } from 'express';
import voteController from '../controllers/vote.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { ROLES } from '../utils/constants';
import { castVoteSchema, voteStatusSchema } from '../validators/vote.validator';

const router = Router();

// All vote routes require authentication
router.use(authenticate);

// ── Voter Routes ─────────────────────────────────────────
router.post(
  '/',
  authorize(ROLES.VOTER),
  validate(castVoteSchema),
  voteController.castVote
);

router.get(
  '/status/:electionId',
  validate(voteStatusSchema),
  voteController.getVoteStatus
);

export default router;

