/**
 * Election Routes
 * POST   /api/elections              — Create election (admin)
 * GET    /api/elections              — List all elections
 * GET    /api/elections/:id          — Get election by ID
 * PATCH  /api/elections/:id          — Update election (admin)
 * DELETE /api/elections/:id          — Delete election (admin)
 * POST   /api/elections/:id/candidates — Add candidate (admin)
 * GET    /api/elections/:id/results  — Get results
 */

const { Router } = require('express');
const electionController = require('../controllers/election.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const {
  createElectionSchema,
  updateElectionSchema,
  addCandidateSchema,
  electionIdParamSchema,
} = require('../validators/election.validator');

const router = Router();

// All election routes require authentication
router.use(authenticate);

// ── Admin Routes ─────────────────────────────────────────
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(createElectionSchema),
  electionController.createElection
);

router.patch(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(updateElectionSchema),
  electionController.updateElection
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(electionIdParamSchema),
  electionController.deleteElection
);

router.post(
  '/:id/candidates',
  authorize(ROLES.ADMIN),
  validate(addCandidateSchema),
  electionController.addCandidate
);

// ── Authenticated Routes (all roles) ─────────────────────
router.get('/', electionController.getAllElections);

router.get(
  '/:id',
  validate(electionIdParamSchema),
  electionController.getElection
);

router.get(
  '/:id/results',
  validate(electionIdParamSchema),
  electionController.getResults
);

module.exports = router;
