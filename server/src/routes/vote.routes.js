/**
 * Vote Routes
 * POST /api/votes                    — Cast a vote
 * GET  /api/votes/status/:electionId — Check vote status
 */

const { Router } = require('express');
const voteController = require('../controllers/vote.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const { castVoteSchema, voteStatusSchema } = require('../validators/vote.validator');

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

module.exports = router;
